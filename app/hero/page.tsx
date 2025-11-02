import OrganizationHero from '@/components/organization-hero';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organization Hero',
  description: 'Découvrez la section héro dédiée aux organisateurs et à la vente de billets.',
};

export default function HeroPage() {
  return (
    <div className="bg-white">
      <OrganizationHero />
    </div>
  );
}
