import { redirect } from 'next/navigation'

/**
 * 루트 페이지 - 인증 상태에 따라 리다이렉션
 */
export default function Home() {
  // 클라이언트 사이드 리다이렉트를 위해 middleware 또는 클라이언트 컴포넌트 사용
  // 여기서는 간단히 dashboard로 리다이렉션 (인증은 middleware에서 처리)
  redirect('/dashboard')
}
