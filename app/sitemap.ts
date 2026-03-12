import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://pick-pool-tool.vercel.app',
      lastModified: new Date(),
    },
    // 公開ページがあれば追加
  ]
}