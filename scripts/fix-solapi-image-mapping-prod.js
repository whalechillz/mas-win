const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('='.repeat(80));
  console.log('🔧 Solapi 이미지 매핑 복구 (prod)');
  console.log('='.repeat(80));
  console.log('');

  const bucket = 'blog-images';
  const imageId = 'ST01FZ251215022939395w6sR1vmZC52';
  const canonicalPath = `originals/mms/solapi/solapi-${imageId}.jpg`;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(canonicalPath);
  const canonicalUrl = urlData?.publicUrl;

  console.log('📁 canonicalPath:', canonicalPath);
  console.log('🌐 canonicalUrl :', canonicalUrl || '(없음)');

  if (!canonicalUrl) {
    console.error('❌ canonical URL을 가져올 수 없습니다.');
    process.exit(1);
  }

  const { data: smsRows, error: smsErr } = await supabase
    .from('channel_sms')
    .select('id')
    .eq('image_url', imageId)
    .order('id', { ascending: true });

  if (smsErr) {
    console.error('❌ channel_sms 조회 실패:', smsErr.message);
    process.exit(1);
  }

  const smsIds = (smsRows || []).map(r => r.id);
  console.log('🧾 사용하는 SMS ID:', smsIds.join(', ') || '(없음)');

  const smsTags = smsIds.map(id => `sms-${id}`);

  const { data: metas, error: metaErr } = await supabase
    .from('image_metadata')
    .select('id, image_url, folder_path, tags')
    .contains('tags', [`solapi-${imageId}`]);

  if (metaErr) {
    console.error('❌ image_metadata 조회 실패:', metaErr.message);
    process.exit(1);
  }

  console.log('📊 기존 메타데이터 개수:', metas?.length || 0);

  if (!metas || metas.length === 0) {
    console.log('➕ 메타데이터 없음 → 새로 생성');
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
      process.exit(1);
    }

    console.log('✅ 메타데이터 생성 완료');
  } else {
    console.log('🛠 기존 메타데이터 갱신');
    const base = metas[0];
    const existingTags = Array.isArray(base.tags) ? base.tags : (base.tags ? [base.tags] : []);
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
      process.exit(1);
    }

    console.log('✅ 메타데이터 업데이트 완료 (id=' + base.id + ')');
  }

  console.log('\n🔍 최종 확인:');
  const { data: finalMetas } = await supabase
    .from('image_metadata')
    .select('id, image_url, folder_path, tags')
    .contains('tags', [`solapi-${imageId}`]);
  console.log(finalMetas);

  console.log('\n✅ Solapi 이미지 매핑 복구 완료');
}

main().then(()=>process.exit(0)).catch(err=>{console.error(err);process.exit(1);});
