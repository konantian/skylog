import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'SKYLOG · Yuan 的飞机图鉴',
  description: '每一架飞机，都是亲眼见过的天空。用真实摄影解锁机型和航司，探索 YYZ 与 YVR 的个人航空收藏。',
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, title: 'SKYLOG', statusBarStyle: 'default' },
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="zh-CN" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"try{if(localStorage.getItem('skylog-theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}"}}/></head><body>{children}</body></html>;
}
