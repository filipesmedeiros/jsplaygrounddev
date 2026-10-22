import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://jsplayground.filipesm.eu',
      lastModified: new Date(),
    },
  ];
}
