export const testimonialsPage = {
  heading: 'Testimonials',
  subheading: 'Trusted by surgeons and hospital leaders across the UK',
  items: [
    {
      name: 'Mr Andrew Clarke',
      role: 'Consultant Trauma Surgeon, NHS Trust',
      image: '/assets/images/testimonial-1.jpg',
      text: 'ORTHOHOUSE UK has been a reliable partner for our trauma theatre. Their Astrolabe portfolio is well supported, and the clinical team responds quickly when we need case-specific guidance.',
      rating: 5
    },
    {
      name: 'Dr Helen Fraser',
      role: 'Clinical Director, Orthopaedic Department',
      image: '/assets/images/testimonial-2.jpg',
      text: 'From procurement to theatre support, ORTHOHOUSE UK delivers consistently. Their understanding of NHS pathways and regulatory requirements gives us confidence in every product they supply.',
      rating: 5
    },
    {
      name: 'Mr Raj Patel',
      role: 'Foot & Ankle Surgeon',
      image: '/assets/images/testimonial-3.jpg',
      text: 'The Foot & Ankle business unit team understands our clinical needs. Product training, educational events, and responsive logistics have made ORTHOHOUSE UK a valued partner in our practice.',
      rating: 5
    },
    {
      name: 'Sarah Whitmore',
      role: 'Theatre Procurement Manager',
      image: '/assets/images/testimonial-4.jpg',
      text: 'ORTHOHOUSE UK simplifies our implant ordering process. Clear documentation, MHRA compliance, and a dedicated account team mean we can focus on patient care rather than supply chain issues.',
      rating: 5
    },
    {
      name: 'Mr David Lennox',
      role: 'Consultant Orthopaedic Surgeon',
      image: '/assets/images/testimonial-5.jpg',
      text: 'Professional, knowledgeable, and genuinely committed to improving patient outcomes. ORTHOHOUSE UK bridges the gap between innovative manufacturers and the realities of hospital practice.',
      rating: 5
    }
  ],
  navAria: (index) => `Go to testimonial ${index + 1}`
}
