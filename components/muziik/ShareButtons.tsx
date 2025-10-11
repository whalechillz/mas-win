import { useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
  description: string;
  language: 'ja' | 'ko';
}

export default function ShareButtons({ url, title, description, language }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = {
    ja: {
      kakao: '카카오톡으로 공유',
      naver: '네이버 블로그로 공유',
      facebook: '페이스북으로 공유',
      twitter: '트위터로 공유',
      copy: 'URL 복사',
      copied: '복사됨!'
    },
    ko: {
      kakao: '카카오톡으로 공유',
      naver: '네이버 블로그로 공유',
      facebook: '페이스북으로 공유',
      twitter: '트위터로 공유',
      copy: 'URL 복사',
      copied: '복사됨!'
    }
  };

  const t = shareText[language];

  const handleKakaoShare = () => {
    if (typeof window !== 'undefined' && window.Kakao) {
      window.Kakao.Link.sendDefault({
        objectType: 'feed',
        content: {
          title: title,
          description: description,
          imageUrl: `${window.location.origin}/muziik/og-image.jpg`,
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
        buttons: [
          {
            title: language === 'ja' ? '자세히 보기' : '자세히 보기',
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
        ],
      });
    } else {
      // Kakao SDK가 없는 경우 fallback
      const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
      window.open(kakaoUrl, '_blank');
    }
  };

  const handleNaverShare = () => {
    const naverUrl = `https://share.naver.com/web/shareView?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(naverUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {/* 카카오톡 공유 */}
      <button
        onClick={handleKakaoShare}
        className="flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
        title={t.kakao}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.486 3 2 6.262 2 10.2c0 2.4 1.6 4.5 4 5.8V21l3.5-2c.5.1 1 .1 1.5.1 5.514 0 10-3.262 10-7.2S17.514 3 12 3z"/>
        </svg>
        <span className="text-sm font-semibold">카카오톡</span>
      </button>

      {/* 네이버 블로그 공유 */}
      <button
        onClick={handleNaverShare}
        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        title={t.naver}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
        </svg>
        <span className="text-sm font-semibold">네이버</span>
      </button>

      {/* 페이스북 공유 */}
      <button
        onClick={handleFacebookShare}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        title={t.facebook}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span className="text-sm font-semibold">페이스북</span>
      </button>

      {/* 트위터 공유 */}
      <button
        onClick={handleTwitterShare}
        className="flex items-center space-x-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
        title={t.twitter}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
        <span className="text-sm font-semibold">트위터</span>
      </button>

      {/* URL 복사 */}
      <button
        onClick={handleCopyUrl}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          copied 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-600 text-white hover:bg-gray-700'
        }`}
        title={t.copy}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        <span className="text-sm font-semibold">
          {copied ? t.copied : t.copy}
        </span>
      </button>
    </div>
  );
}

// Kakao SDK 타입 선언
declare global {
  interface Window {
    Kakao: any;
  }
}
