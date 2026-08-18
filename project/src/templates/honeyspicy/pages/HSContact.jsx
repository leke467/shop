import HSPageTransition from '../components/HSPageTransition'
import HSAnimatedSection from '../components/HSAnimatedSection'
import HSContactForm from '../components/HSContactForm'
import HSLocationMap from '../components/HSLocationMap'

export default function HSContact({ shop }) {
  return (
    <HSPageTransition>
      <main className="hs-contact-page">
        <section className="hs-contact-hero"><div className="hs-container"><HSAnimatedSection><h1>Get In Touch</h1><p>We&apos;d love to hear from you!</p></HSAnimatedSection></div></section>
        <section className="hs-contact-content hs-section">
          <div className="hs-container">
            <div className="hs-contact-wrapper">
              <HSAnimatedSection direction="left"><div className="hs-contact-form-section"><h2>Send Us a Message</h2><p>Have a question, feedback, or special request?</p><HSContactForm shop={shop} /></div></HSAnimatedSection>
              <HSAnimatedSection direction="right" delay={0.3}><div className="hs-contact-location-section"><h2>Visit Our Store</h2><p>Stop by our location and experience our products in person.</p><HSLocationMap shop={shop} /></div></HSAnimatedSection>
            </div>
          </div>
        </section>
      </main>
    </HSPageTransition>
  )
}
