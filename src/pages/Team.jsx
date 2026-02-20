import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import './Team.css'

const Team = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const teamMembers = [
    {
      name: 'Dr. Sarah Williams',
      role: 'Chief Medical Officer & Prosthetics Specialist',
      image: '/assets/images/team-1.jpg',
      bio: 'Dr. Williams brings over 20 years of experience in prosthetics and rehabilitation medicine. She holds a Doctor of Medicine from Johns Hopkins University and specializes in upper and lower limb prosthetics. Her research on advanced socket design has been published in leading medical journals.',
      credentials: 'MD, PhD, CPO',
      experience: '20+ years',
      social: {
        linkedin: 'https://linkedin.com/in/sarah-williams',
        twitter: 'https://twitter.com/sarah_williams',
        email: 's.williams@cybron.com'
      }
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Senior Biomedical Engineer',
      image: '/assets/images/team-2.jpg',
      bio: 'Dr. Chen is a leading expert in biomedical device design with a PhD in Biomedical Engineering from MIT. He has developed innovative prosthetic technologies and holds 15+ patents in the field. His work focuses on advanced materials and sensor integration for next-generation prosthetics.',
      credentials: 'PhD, MS Biomedical Engineering',
      experience: '15+ years',
      social: {
        linkedin: 'https://linkedin.com/in/michael-chen',
        twitter: 'https://twitter.com/michael_chen',
        email: 'm.chen@cybron.com'
      }
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Orthotics Specialist & Clinical Director',
      image: '/assets/images/team-3.jpg',
      bio: 'Dr. Rodriguez is a certified orthotist with extensive experience in custom orthotic solutions for spinal, lower limb, and upper limb conditions. She completed her residency at the Mayo Clinic and has been instrumental in developing our pediatric orthotics program.',
      credentials: 'CPO, CO',
      experience: '12+ years',
      social: {
        linkedin: 'https://linkedin.com/in/emily-rodriguez',
        twitter: 'https://twitter.com/emily_rodriguez',
        email: 'e.rodriguez@cybron.com'
      }
    },
    {
      name: 'Dr. James Anderson',
      role: 'Patient Care Coordinator & Rehabilitation Specialist',
      image: '/assets/images/team-4.jpg',
      bio: 'Dr. Anderson ensures seamless patient experiences from initial consultation through long-term care. With a background in physical therapy and patient advocacy, he coordinates care teams and helps patients navigate their journey to improved mobility and independence.',
      credentials: 'DPT, MPT',
      experience: '10+ years',
      social: {
        linkedin: 'https://linkedin.com/in/james-anderson',
        twitter: 'https://twitter.com/james_anderson',
        email: 'j.anderson@cybron.com'
      }
    },
    {
      name: 'Dr. Lisa Thompson',
      role: 'Pediatric Prosthetics Specialist',
      image: '/assets/images/team-5.jpg',
      bio: 'Dr. Thompson specializes in pediatric prosthetics and orthotics, helping children achieve their full potential. She has a unique approach to working with young patients and their families, creating solutions that grow with children.',
      credentials: 'CPO, MS Pediatric Rehabilitation',
      experience: '8+ years',
      social: {
        linkedin: 'https://linkedin.com/in/lisa-thompson',
        twitter: 'https://twitter.com/lisa_thompson',
        email: 'l.thompson@cybron.com'
      }
    },
    {
      name: 'Dr. Robert Martinez',
      role: 'Research & Development Director',
      image: '/assets/images/team-6.jpg',
      bio: 'Dr. Martinez leads our R&D initiatives, focusing on cutting-edge prosthetic and orthotic technologies. With a background in materials science and mechanical engineering, he oversees the development of innovative solutions that push the boundaries of what\'s possible.',
      credentials: 'PhD Materials Science, MS Mechanical Engineering',
      experience: '14+ years',
      social: {
        linkedin: 'https://linkedin.com/in/robert-martinez',
        twitter: 'https://twitter.com/robert_martinez',
        email: 'r.martinez@cybron.com'
      }
    }
  ]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="team-page">
      <div className="page-header">
        <div className="container">
          <h1>Our Team</h1>
          <p>Meet the experts dedicated to improving lives</p>
        </div>
      </div>

      <div className="team-content">
        <div className="container">
          <div className="team-grid" ref={ref}>
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                className="team-card"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="team-image">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=400&background=64d9b9&color=fff&bold=true`
                    }}
                  />
                  <div className="team-overlay">
                    <div className="team-social">
                      <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <i className="fab fa-linkedin-in"></i>
                      </a>
                      <a href={member.social.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                        <i className="fab fa-twitter"></i>
                      </a>
                      <a href={`mailto:${member.social.email}`} aria-label="Email">
                        <i className="fas fa-envelope"></i>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="team-info">
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                  <p className="team-credentials">{member.credentials}</p>
                  <p className="team-bio">{member.bio}</p>
                  <div className="team-experience">
                    <i className="fas fa-clock"></i> {member.experience}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Team
