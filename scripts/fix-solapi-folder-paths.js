const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const bucket = 'blog-images';
const IMAGE_IDS = [
  'ST01FZ251120003622665RRWBP6KAVqq',
  'ST01FZ251029054420785uh0PXUpnoe2',
  'ST01FZ251215022939395w6sR1vmZC52',
];

async function fixOne(imageId) {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 Solapi 폴더 경로 정리:', imageId);

  const canonicalPath = `solapi/solapi-${imageId}.jpg`;
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(canonicalPath);
  const canonicalUrl = urlData?.publicUrl;

  console.log('📁 canonicalPath:', canonicalPath);
  console.log('🌐 canonicalUrl :', canonicalUrl || '(없음)');

  if (!canonicalUrl) {
    console.warn('⚠️ canonical URL을 가져올 수 없습니다. 파일이 solapi/ 폴더에 있는지 확인 필요');
    return;
  }

  const { data: metas, error: metaErr } = await supabase
    .from('image_metadata')
    .select('id, image_url, folder_path, tags')
    .contains('tags', [`solapi-${imageId}`]);

  if (metaErr) {
    console.error('❌ image_metadata 조회 실패:', metaErr.message);
    return;
  }

  if (!metas || metas.length === 0) {
    console.log('➕ 메타데이터 없음 → 새로 생성');
    const { data: smsRows } = await supabase
      .from('channel_sms')
      .select('id')
      .eq('image_url', imageId);
    const smsIds = (smsRows || []).map(r => r.id);
    const smsTags = smsIds.map(id => `sms-${id}`);

    const tags = [
      `solapi-${imageId}`,
      'mms',
      'solapi-permanent',
      ...smsTags,
    ];

    const { error: insertErr } = await supabase
      .from('image_metadata')
      .insert({
        image_url: canonicalUrl,
        folder_path: canonicalPath,
        source: 'mms',
        channel: 'sms',
        upload_source: 'solapi-permanent',
        tags,
        title: `MMS 이미지 - Solapi (${imageId})`,
        alt_text: 'MMS 이미지',
        updated_at: new Date().toISOString(),
      });

    if (insertErr) {
      console.error('❌ 메타데이터 생성 실패:', insertErr.message);
    } else {
      console.log('✅ 메타데이터 생성 완료');
    }
    return;
  }

  // 기존 메타데이터 업데이트
  console.log('📊 기존 메타데이터 개수:', metas.length);
  const base = metas[0];
  const existingTags = Array.isArray(base.tags) ? base.tags : (base.tags ? [base.tags] : []);

  const { data: smsRows } = await supabase
    .from('channel_sms')
    .select('id')
    .eq('image_url', imageId);
  const smsIds = (smsRows || []).map(r => r.id);
  const smsTags = smsIds.map(id => `sms-${id}`);

  const mergedTags = Array.from(new Set([
    ...existingTags,
    `solapi-${imageId}`,
    'mms',
    'solapi-permanent',
    ...smsTags,
  ]));

  const { error: updErr } = await supabase
    .from('image_metadata')
    .update({
      image_url: canonicalUrl,
      folder_path: canonicalPath,
      source: 'mms',
      channel: 'sms',
      tags: mergedTags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', base.id);

  if (updErr) {
    console.error('❌ 메타데이터 업데이트 실패:', updErr.message);
  } else {
    console.log('✅ 메타데이터 업데이트 완료 (id=' + base.id + ')');
  }
}

async function main() {
  for (const id of IMAGE_IDS) {
    await fixOne(id);
  }

  console.log('\n✅ Solapi 폴더 경로 정리 완료');
}

main().then(()=>process.exit(0)).catch(err=>{console.error(err);process.exit(1);});
