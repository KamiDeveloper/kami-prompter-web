import { Hero } from '@/components/landing/Hero'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { SecuritySection } from '@/components/landing/SecuritySection'
import { Footer } from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full items-center">
      <Hero />
      <FeaturesSection />
      <SecuritySection />
      <Footer />
    </div>
  )
}
