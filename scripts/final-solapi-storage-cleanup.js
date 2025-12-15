/**
 * 최종 Solapi 스토리지/메타데이터 정리 스크립트
 *
 * 목표
 * 1) Solapi 이미지 파일을 imageId(ST01FZ...) 기준으로 1개만 유지
 *    - canonical 경로: originals/mms/solapi/solapi-{imageId}.jpg
 *    - temp/solapi 및 timestamp 붙은 중복 파일 제거
 * 2) image_metadata를 canonical URL 기준으로 통합
 *    - image_url = canonical Supabase URL
 *    - tags: solapi-{imageId}, sms-{id} 등 합쳐서 한 레코드에 유지
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalSolapiCleanup() {
  console.log('='.repeat(100));
  console.log('🧹 Solapi 이미지 최종 정리 시작');
  console.log('='.repeat(100));
  console.log('');

  // 1. originals/mms/solapi, temp/solapi 의 모든 파일 조회
  const bucket = 'blog-images';

  async function listFolder(prefix) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } });
    if (error) {
      console.error(`❌ 폴더 조회 실패 (${prefix}):`, error.message);
      return [];
    }
    return data || [];
  }

  const originalsPrefix = 'originals/mms/solapi';
  const tempPrefix = 'temp/solapi';

  console.log('📁 originals/mms/solapi 스캔 중...');
  const originalsFiles = await listFolder('originals/mms/solapi');
  console.log(`   → ${originalsFiles.length}개`);

  console.log('📁 temp/solapi 스캔 중...');
  const tempFiles = await listFolder('temp/solapi');
  console.log(`   → ${tempFiles.length}개`);

  const allFiles = [];

  function pushFiles(list, prefix) {
    for (const f of list) {
      if (!f.id) continue; // 폴더는 건너뜀
      allFiles.push({
        name: f.name,
        created_at: f.created_at,
        prefix,
      });
    }
  }

  pushFiles(originalsFiles, originalsPrefix);
  pushFiles(tempFiles, tempPrefix);

  if (allFiles.length === 0) {
    console.log('\nℹ️ Solapi 관련 파일이 없습니다. 종료합니다.');
    return;
  }

  // 2. imageId 기준으로 그룹화
  const groups = new Map();
  const idRegex = /solapi-(ST01FZ[0-9A-Za-z]+)(?:-(\d+))?\.jpg$/;

  for (const file of allFiles) {
    const match = file.name.match(idRegex);
    if (!match) continue;
    const imageId = match[1];
    const timestamp = match[2] ? parseInt(match[2], 10) : null;
    const fullPath = `${file.prefix}/${file.name}`;

    if (!groups.has(imageId)) groups.set(imageId, []);
    groups.get(imageId).push({
      name: file.name,
      fullPath,
      prefix: file.prefix,
      created_at: file.created_at,
      timestamp,
    });
  }

  console.log(`\n📦 Solapi imageId 그룹: ${groups.size}개`);

  let moved = 0;
  let deleted = 0;
  let kept = 0;

  // image_metadata 정리를 위해 canonical 정보 수집
  const canonicalMap = new Map(); // imageId -> canonicalPath

  for (const [imageId, files] of groups.entries()) {
    console.log(`\n📦 imageId: ${imageId} (파일 ${files.length}개)`);

    const canonicalName = `solapi-${imageId}.jpg`;
    const canonicalPath = `${originalsPrefix}/${canonicalName}`;

    const originals = files.filter(f => f.prefix === originalsPrefix);
    const temps = files.filter(f => f.prefix === tempPrefix);

    // 2-1. canonical 파일이 originals에 있는지 확인
    const hasCanonicalInOriginals = originals.some(f => f.fullPath === canonicalPath);

    if (!hasCanonicalInOriginals) {
      // temp/solapi 에만 있다면 -> canonical 위치로 이동
      const source = temps[0];
      if (source) {
        console.log(`   📁 canonical 없음 → temp에서 originals로 이동: ${source.fullPath} → ${canonicalPath}`);
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(source.fullPath);
          if (downloadError) {
            console.error('   ❌ 다운로드 실패:', downloadError.message);
          } else {
            const buffer = Buffer.from(await fileData.arrayBuffer());
            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(canonicalPath, buffer, { contentType: 'image/jpeg', upsert: true });
            if (uploadError) {
              console.error('   ❌ 업로드 실패:', uploadError.message);
            } else {
              const { error: removeError } = await supabase.storage
                .from(bucket)
                .remove([source.fullPath]);
              if (removeError) {
                console.warn('   ⚠️ temp 파일 삭제 실패 (무시):', removeError.message);
              } else {
                moved++;
                console.log('   ✅ 이동 완료');
              }
            }
          }
        } catch (e) {
          console.error('   ❌ 이동 중 오류:', e.message);
        }
      } else {
        console.log('   ⚠️ originals/ temp 어디에도 canonical 후보가 없습니다. 건너뜀');
        continue;
      }
    } else {
      console.log('   ✅ canonical 파일 이미 존재:', canonicalPath);
      kept++;
    }

    canonicalMap.set(imageId, canonicalPath);

    // 2-2. canonical 이외의 나머지 파일 삭제 (originals + temp 모두)
    for (const f of files) {
      if (f.fullPath === canonicalPath) continue;
      console.log(`   🗑️ 중복 파일 삭제: ${f.fullPath}`);
      const { error: remErr } = await supabase.storage
        .from(bucket)
        .remove([f.fullPath]);
      if (remErr) {
        console.error('     ❌ 삭제 실패 (무시):', remErr.message);
      } else {
        deleted++;
      }
    }
  }

  // temp/solapi 에 regex에 안 맞는 파일이 남았다면 추가로 삭제
  for (const f of tempFiles) {
    if (!f.id) continue;
    const match = f.name.match(idRegex);
    if (!match) {
      const fullPath = `${tempPrefix}/${f.name}`;
      console.log(`   🗑️ 기타 temp 파일 삭제: ${fullPath}`);
      await supabase.storage.from(bucket).remove([fullPath]);
      deleted++;
    }
  }

  console.log('\n📁 파일 정리 요약');
  console.log(`   유지(canonical): ${kept}개`);
  console.log(`   이동(temp → originals): ${moved}개`);
  console.log(`   삭제: ${deleted}개`);

  // 3. image_metadata 정리
  console.log('\n📋 image_metadata 정리 중...');

  for (const [imageId, canonicalPath] of canonicalMap.entries()) {
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(canonicalPath);
    const canonicalUrl = urlData?.publicUrl;
    if (!canonicalUrl) {
      console.warn(`   ⚠️ canonical URL 생성 실패: ${canonicalPath}`);
      continue;
    }

    // 이 imageId 관련 메타데이터 모두 조회
    const { data: metas, error: metaErr } = await supabase
      .from('image_metadata')
      .select('id, image_url, tags, source, channel')
      .contains('tags', [`solapi-${imageId}`]);

    if (metaErr) {
      console.error(`   ❌ 메타데이터 조회 실패 (imageId=${imageId}):`, metaErr.message);
      continue;
    }

    const allMetas = metas || [];
    if (allMetas.length === 0) {
      // 메타데이터가 없으면 새로 생성
      console.log(`   ➕ 메타데이터 없음 → 새로 생성 (imageId=${imageId})`);
      const { error: insertErr } = await supabase
        .from('image_metadata')
        .insert({
          image_url: canonicalUrl,
          folder_path: canonicalPath,
          source: 'mms',
          channel: 'sms',
          tags: [`solapi-${imageId}`, 'mms', 'solapi-permanent'],
          upload_source: 'solapi-permanent',
          title: `MMS 이미지 - Solapi (${imageId})`,
          alt_text: 'MMS 이미지',
          updated_at: new Date().toISOString()
        });
      if (insertErr) {
        console.error('   ❌ 메타데이터 생성 실패:', insertErr.message);
      }
      continue;
    }

    // 기존 메타데이터가 여러 개라면 canonicalUrl 기준으로 통합
    let canonicalMeta = allMetas.find(m => m.image_url === canonicalUrl);
    const otherMetas = allMetas.filter(m => m.image_url !== canonicalUrl);

    if (!canonicalMeta) {
      // canonicalUrl 을 가진 메타데이터가 없으면 하나를 canonical 로 사용
      canonicalMeta = allMetas[0];
      console.log(`   🔁 canonical 메타데이터 재지정 (imageId=${imageId}, id=${canonicalMeta.id})`);
      const { error: upd } = await supabase
        .from('image_metadata')
        .update({ image_url: canonicalUrl, folder_path: canonicalPath, source: 'mms', channel: 'sms', updated_at: new Date().toISOString() })
        .eq('id', canonicalMeta.id);
      if (upd) {
        console.error('   ❌ canonical 메타데이터 URL 업데이트 실패:', upd.message);
      }
    }

    // 태그 통합
    let mergedTags = new Set(canonicalMeta.tags || []);
    for (const m of otherMetas) {
      if (Array.isArray(m.tags)) {
        m.tags.forEach(t => mergedTags.add(t));
      }
    }
    // Solapi 관련 기본 태그 강제 포함
    mergedTags.add(`solapi-${imageId}`);
    mergedTags.add('mms');
    mergedTags.add('solapi-permanent');

    const mergedTagsArr = Array.from(mergedTags);

    const { error: tagUpdErr } = await supabase
      .from('image_metadata')
      .update({ tags: mergedTagsArr, image_url: canonicalUrl, folder_path: canonicalPath, source: 'mms', channel: 'sms', updated_at: new Date().toISOString() })
      .eq('id', canonicalMeta.id);

    if (tagUpdErr) {
      console.error('   ❌ 태그 통합 실패:', tagUpdErr.message);
    } else {
      console.log(`   ✅ 메타데이터 통합 완료 (imageId=${imageId}, id=${canonicalMeta.id})`);
    }

    // 나머지 중복 메타데이터 삭제
    for (const m of otherMetas) {
      const { error: delErr } = await supabase
        .from('image_metadata')
        .delete()
        .eq('id', m.id);
      if (delErr) {
        console.error('   ❌ 중복 메타데이터 삭제 실패:', delErr.message);
      } else {
        console.log(`   🗑️ 중복 메타데이터 삭제 (id=${m.id})`);
      }
    }
  }

  console.log('\n'.repeat(2) + '='.repeat(100));
  console.log('✅ Solapi 이미지 최종 정리 완료');
  console.log('='.repeat(100));
}

finalSolapiCleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 정리 스크립트 실행 중 오류:', err);
    process.exit(1);
  });

