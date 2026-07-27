/**
 * FAQs page content + static fallback when Supabase is empty/unavailable.
 * Category slugs match DB: mirai_shoulder | osteosynt | orthosintex
 */

export const FAQ_CATEGORIES = [
  {
    slug: 'mirai_shoulder',
    title: 'FAQs for MIRAI® Shoulder System',
    shortTitle: 'MIRAI® Shoulder',
    description: 'System overview, biomaterials, biomechanical evidence, digital planning, and clinical education.'
  },
  {
    slug: 'osteosynt',
    title: 'FAQs for Osteosynt (EincoBio)',
    shortTitle: 'Osteosynt',
    description: 'Synthetic bone substitutes — forms, indications, biological profile, and ordering.'
  },
  {
    slug: 'orthosintex',
    title: 'FAQs for Orthosintex (Episcan)',
    shortTitle: 'Orthosintex',
    description: 'Foot and ankle fixation systems — screw sizes, procedures, materials, and UK registration.'
  }
]

export const faqCategoryTitle = (slug) =>
  FAQ_CATEGORIES.find((c) => c.slug === slug)?.title || slug

export const faqCategoryShortTitle = (slug) => {
  const cat = FAQ_CATEGORIES.find((c) => c.slug === slug)
  return cat?.shortTitle || cat?.title || slug
}

export const faqsPage = {
  hero: {
    eyebrow: 'ORTHOHOUSE UK',
    headline: 'Frequently asked questions',
    intro:
      'Product FAQs for the MIRAI® Shoulder System, Osteosynt (EincoBio), and Orthosintex (Episcan) — clear answers for surgeons, procurement teams, and clinical partners.'
  },
  cta: {
    eyebrow: 'Still have questions?',
    title: 'Speak with our specialist team',
    body: 'Our London office is ready to help with product literature, quotations, and partnership discussions.',
    button: 'Contact us',
    path: '/contact'
  }
}

/** Static seed — mirrors migration seed for UK branch when DB is empty/errors */
export const faqsFallbackItems = [
  {
    id: 'static-m1',
    category: 'mirai_shoulder',
    question: "What is the MIRAI® Shoulder System provided by OrthoHouse? What clinical indications does it cover, and what configurations are available?",
    answer: "Distributed by OrthoHouse, the MIRAI® Shoulder System is a comprehensive, modular shoulder arthroplasty platform designed for both Anatomical and Reverse Shoulder Arthroplasty (RSA). It offers UK orthopedic consultants maximum intraoperative flexibility, joint stability, and optimal biomechanical restoration across primary, trauma, and revision cases.\n\nThe MIRAI® system is a fully convertible platform supporting seamless intraoperative transitions through three versatile stem configurations:\nStemless Version (utilizing the high-fixation Humeral Core Cage)\nStemmed Version\nTrauma Version (utilizing the dedicated Trauma Core)\n\nSources:\nPermedica Orthopaedics – MIRAI® System Overview & Product Catalog\nPermedica Orthopaedics – MIRAI® Modular Shoulder System Brochure",
    display_order: 1
  },
  {
    id: 'static-m2',
    category: 'mirai_shoulder',
    question: "What proprietary technologies are integrated into the MIRAI® Shoulder System?",
    answer: "The MIRAI® System incorporates three flagship biomaterial innovations:\nTRASER® (Trabecular Laser Melted Titanium): A 3D-printed porous titanium structure mimicking natural trabecular bone to accelerate biological ingrowth and primary/secondary fixation.\nVITAL-B® (TiNbN Coating): A ceramic-like Titanium Niobium Nitride protective layer offering superior surface hardness, reduced friction coefficients, and hypoallergenic protection.\nVITAL-E® (+0.1% Vitamin E Polyethylene): Highly cross-linked polyethylene infused with Vitamin E to provide maximum oxidative stability, mechanical strength, and ultra-low wear rates over time.\n\nSource: Permedica Orthopaedics – Advanced Biomaterials & Surface Technology Technical Dossier",
    display_order: 2
  },
  {
    id: 'static-m3',
    category: 'mirai_shoulder',
    question: "How does TRASER® technology improve fixation in stemless cases?",
    answer: "TRASER®'s open-pore 3D printing trabecular matrix provides an ideal scaffold for osteoblast migration and vascularization. In stemless configurations, the Humeral Core Cage with TRASER® delivers immediate mechanical stability and long-term bone preservation without invading the humeral canal.\n\nSource: Permedica Orthopaedics – TRASER® Technology White Paper & Surgical Technique",
    display_order: 3
  },
  {
    id: 'static-m4',
    category: 'mirai_shoulder',
    question: "Is the MIRAI® System suitable for patients with metal hypersensitivity, and how durable is the VITAL-B® coating against peeling?",
    answer: "Yes. The MIRAI® System is fully engineered for patients with documented hypersensitivity to nickel, cobalt, chromium, or heavy metals:\nMetal Ion Barrier: VITAL-B® (TiNbN) forms a dense, biologically inert barrier that eliminates heavy metal ion migration into surrounding tissue.\nAtomic-Level Bond & Anti-Delamination: Applied via advanced Physical Vapor Deposition (PVD), VITAL-B® forms an atomic-level metallurgical bond with the substrate rather than a conventional sprayed layer, guaranteeing the coating will not peel, flake, or delaminate under cyclic loading.\nCeramic-Like Hardness: Delivers extreme surface hardness (~2,000–2,500 Vickers Hardness) with ultra-low friction, dramatically reducing abrasive wear and debris.\n\nSources:\nPermedica Orthopaedics – BIOLOY® Hypoallergenic Surface Modification Dossier\nISO 20502: Determination of Adhesion & Anti-Delamination of Ceramic Coatings\nISO 10993-18: Biological Evaluation of Medical Devices – Chemical Characterization & Ion Release Barriers",
    display_order: 4
  },
  {
    id: 'static-m5',
    category: 'mirai_shoulder',
    question: "What simulator wear testing supports the long-term durability of OrthoHouse’s MIRAI® System?",
    answer: "The MIRAI® System features an innovative Material-Inversion Design where the articulating glenoid insert is a Ti6Al4V alloy PVD-coated with hard, scratch-resistant TiNbN (VITAL-B®), while the humeral head is made of highly cross-linked, vitamin E-infused UHMWPE (VITAL-E®). Under multi-million cycle simulator testing:\nTest Parameters: In tests with a constant axial load of 756 N combined with angular motions, the system was run for up to 2.5 million cycles.\nProven Results: After 2.5 million cycles, the mean mass loss of the humeral head was recorded at just 0.68 mg.\nClinical Significance: The extremely low wear rate confirms that non-spherical, low-conforming designs reduce stress, translational forces, and frictional torque typically responsible for bearing degradation and aseptic loosening.\n\nSources:\nPermedica S.p.A. – In-Vitro Biomechanical Wear Simulator Performance Report\nThe Bone & Joint Journal – Biomechanical & Tribological Evaluation Studies\nNational Center for Biotechnology Information (NCBI / PubMed) – Polyethylene Wear Dynamics in Shoulder Arthroplasty",
    display_order: 5
  },
  {
    id: 'static-m6',
    category: 'mirai_shoulder',
    question: "How does 3D MIRAI® Planning assist surgeons before surgery?",
    answer: "OrthoHouse provides integrated 3D MIRAI® Planning software, allowing consultants to perform precise preoperative CT-based anatomical evaluation, optimal implant sizing, glenoid positioning, and offset restoration tailored to each patient’s unique anatomy.\n\nSource: Permedica Orthopaedics – 3D MIRAI® Digital Preoperative Planning Suite",
    display_order: 6
  },
  {
    id: 'static-m7',
    category: 'mirai_shoulder',
    question: "Can UK consultants visit a reference center, attend workshops, or discuss clinical outcomes with peer surgeons?",
    answer: "Yes. OrthoHouse maintains active clinical reference networks across Europe and the Middle East. We facilitate peer-to-peer discussions, Cadaver workshops, clinical observation sessions, and academic data sharing with leading consultants using the system.\n\nSource: OrthoHouse Medical Education & Clinical Events Portal",
    display_order: 7
  },
  {
    id: 'static-o1',
    category: 'osteosynt',
    question: "What is OSTEOSYNT®?",
    answer: "OSTEOSYNT® is a family of synthetic bone substitute products, utilising the ultimate generation of biphasic bioceramics, containing Hydroxyapatite and β-Tricalcium Phosphate. It is highly biocompatible due to its unique nanostructure, which features micro, meso, and macro intercommunicating pores, as well as its unmatched surface topography that enhances cell adhesion, proliferation, and differentiation. Both osteoconductive and osteoinductive, OSTEOSYNT® allows for controlled bone remodelling and resorption. OSTEOSYNT®'s unique chemical composition is both biomimetic and bioactive, allowing continuity between the existing bone and the new bone.\n\nOSTEOSYNT® is widely used across orthopaedics, dentistry, plastic, and maxillofacial surgery to repair, reconstruct, or recover bone loss.\n\nThe Brazilian nanotechnology company, Eincobio, manufactures OSTEOSYNT®.",
    display_order: 1
  },
  {
    id: 'static-o2',
    category: 'osteosynt',
    question: "What makes OSTEOSYNT® different?",
    answer: "As the composition is very similar to human bone matrix, OSTEOSYNT® acts as a scaffold for the formation of new bone tissue and is gradually replaced according to the metabolic activity of each patient. OSTEOSYNT® provides greater efficiency due to its chemical and unique physical characteristics.",
    display_order: 2,
    answer_image_url: "/assets/faqs/osteosynt-characteristics.png"
  },
  {
    id: 'static-o3',
    category: 'osteosynt',
    question: "What forms does it come in?",
    answer: "Injectable (pre-hydrated)\nGranules\nSpheres\nBlocks and wedges\nCervical blocks and craniotomy buttons\n\nPlease note: Blocks and wedges can be cut to size, and custom shapes are available upon request (with a lead time of approximately 4 weeks).",
    display_order: 3
  },
  {
    id: 'static-o4',
    category: 'osteosynt',
    question: "What indications is OSTEOSYNT® approved for?",
    answer: "OSTEOSYNT® is used across orthopedics, dentistry, plastic, and maxillofacial surgery to repair, reconstruct, or recover bone loss. OSTEOSYNT® has been used for over 40 years in infections, revision surgery, spine deformities, fractures, fusions, revision prosthesis, pseudo arthritis, and more.",
    display_order: 4
  },
  {
    id: 'static-o5',
    category: 'osteosynt',
    question: "Does OSTEOSYNT® contain antibiotics?",
    answer: "OSTEOSYNT® does not contain antibiotics. Our products can be hydrated with saline, blood, or any liquid antibiotics, allowing surgeons complete control in the customised management of any infection(s) and to provide an option for patients with specific allergies, intolerances, or in cases of specific antibiotic resistance.",
    display_order: 5
  },
  {
    id: 'static-o6',
    category: 'osteosynt',
    question: "What are the biological contamination risks?",
    answer: "OSTEOSYNT® is 100% synthetic, giving you peace of mind by eliminating any of the risks associated with animal-derived (xenografts) or human donor materials (allografts).",
    display_order: 6
  },
  {
    id: 'static-o7',
    category: 'osteosynt',
    question: "Does OSTEOSYNT® provide immediate stability?",
    answer: "OSTEOSYNT® is a bioactive ceramic that works differently from traditional bone cement. Our range of blocks and wedges has been manufactured to withstand high mechanical loads. OSTEOSYNT® blocks and wedges can stand up to 90 MPa of load, compared to cortical bone of approximately 100 MPa.",
    display_order: 7
  },
  {
    id: 'static-o8',
    category: 'osteosynt',
    question: "Can OSTEOSYNT® be seen on X-ray?",
    answer: "OSTEOSYNT® is radio-opaque, so it can be clearly seen on X-ray.",
    display_order: 8
  },
  {
    id: 'static-o9',
    category: 'osteosynt',
    question: "How do I order?",
    answer: "Please visit our Meet the Team page to speak with your local OrthoHouse representative.",
    display_order: 9
  },
  {
    id: 'static-x1',
    category: 'orthosintex',
    question: "What screw sizes are the foot and ankle systems?",
    answer: "The Orthosintex Episcan portfolio offers screw systems in 2.7 mm, 3.5 mm, and 4.0 mm diameters, depending on the implant and procedure.",
    display_order: 1
  },
  {
    id: 'static-x2',
    category: 'orthosintex',
    question: "What is the main focus of the Orthosintex Episcan portfolio?",
    answer: "The Orthosintex Episcan portfolio provides comprehensive fixation solutions for foot and ankle surgery. The range includes implants designed for forefoot, midfoot, and hindfoot procedures, as well as flatfoot correction, trauma, arthrodesis, osteotomies, and minimally invasive surgery (MIS).",
    display_order: 2
  },
  {
    id: 'static-x3',
    category: 'orthosintex',
    question: "Where are the products manufactured?",
    answer: "All Orthosintex products are designed, researched, and manufactured in Italy. 100% of the research, development, and manufacturing takes place within Orthosintex's dedicated manufacturing facilities, ensuring high-quality standards and full control of the production process.",
    display_order: 3
  },
  {
    id: 'static-x4',
    category: 'orthosintex',
    question: "What foot and ankle procedures can the Orthosintex portfolio support?",
    answer: "The portfolio supports a wide range of foot and ankle procedures, including:\nHallux valgus correction\nArthrodesis\nOsteotomies\nFracture fixation\nFlatfoot reconstruction\nCalcaneal osteotomies\nMinimally invasive foot surgery (MIS)",
    display_order: 4
  },
  {
    id: 'static-x5',
    category: 'orthosintex',
    question: "Are our products MHRA registered?",
    answer: "Yes. Orthosintex Episcan products are registered with the UK's Medicines and Healthcare products Regulatory Agency (MHRA) for use within the UK.",
    display_order: 5
  },
  {
    id: 'static-x6',
    category: 'orthosintex',
    question: "Are the products sterile?",
    answer: "Yes. All Orthosintex Episcan implants are supplied sterile and ready for use, helping to support efficient theatre workflow and minimise preparation time.",
    display_order: 6
  },
  {
    id: 'static-x7',
    category: 'orthosintex',
    question: "What material are Orthosintex implants made from?",
    answer: "Most Orthosintex implants are manufactured from Titanium Grade 5 (Ti-6Al-4V) or Titanium Grade 2, depending on the implant. Titanium is selected for its excellent strength, corrosion resistance, biocompatibility, and compatibility with orthopaedic applications.",
    display_order: 7
  },
  {
    id: 'static-x8',
    category: 'orthosintex',
    question: "Are the screws locking, non-locking, or both?",
    answer: "We provide cortical non-locking and locking screws for 2.7mm, 3.5mm, and 4.0mm locking screw for the VCP plate.",
    display_order: 8
  }
]
