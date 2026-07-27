-- Replace FAQs content with MIRAI / Osteosynt / Orthosintex product FAQs
-- Categories (DB slugs): 'mirai_shoulder' | 'osteosynt' | 'orthosintex'
-- Adds optional answer_image_url for inline answer figures

ALTER TABLE public.faqs DROP CONSTRAINT IF EXISTS faqs_category_check;

ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS answer_image_url TEXT;

-- Remove previous General / Clinical seed (and any other rows)
DELETE FROM public.faqs;

ALTER TABLE public.faqs
  ADD CONSTRAINT faqs_category_check CHECK (
    category IN ('mirai_shoulder', 'osteosynt', 'orthosintex')
  );
-- Seed UK branch (branch_id = 2)
INSERT INTO public.faqs (
  branch_id,
  category,
  question,
  answer,
  display_order,
  is_published,
  answer_image_url
)
SELECT
  2,
  v.category,
  v.question,
  v.answer,
  v.display_order,
  TRUE,
  v.answer_image_url
FROM (
  VALUES
    (
      'mirai_shoulder',
      'What is the MIRAI® Shoulder System provided by OrthoHouse? What clinical indications does it cover, and what configurations are available?',
      'Distributed by OrthoHouse, the MIRAI® Shoulder System is a comprehensive, modular shoulder arthroplasty platform designed for both Anatomical and Reverse Shoulder Arthroplasty (RSA). It offers UK orthopedic consultants maximum intraoperative flexibility, joint stability, and optimal biomechanical restoration across primary, trauma, and revision cases.

The MIRAI® system is a fully convertible platform supporting seamless intraoperative transitions through three versatile stem configurations:
Stemless Version (utilizing the high-fixation Humeral Core Cage)
Stemmed Version
Trauma Version (utilizing the dedicated Trauma Core)

Sources:
Permedica Orthopaedics – MIRAI® System Overview & Product Catalog
Permedica Orthopaedics – MIRAI® Modular Shoulder System Brochure',
      1,
      NULL
    ),
    (
      'mirai_shoulder',
      'What proprietary technologies are integrated into the MIRAI® Shoulder System?',
      'The MIRAI® System incorporates three flagship biomaterial innovations:
TRASER® (Trabecular Laser Melted Titanium): A 3D-printed porous titanium structure mimicking natural trabecular bone to accelerate biological ingrowth and primary/secondary fixation.
VITAL-B® (TiNbN Coating): A ceramic-like Titanium Niobium Nitride protective layer offering superior surface hardness, reduced friction coefficients, and hypoallergenic protection.
VITAL-E® (+0.1% Vitamin E Polyethylene): Highly cross-linked polyethylene infused with Vitamin E to provide maximum oxidative stability, mechanical strength, and ultra-low wear rates over time.

Source: Permedica Orthopaedics – Advanced Biomaterials & Surface Technology Technical Dossier',
      2,
      NULL
    ),
    (
      'mirai_shoulder',
      'How does TRASER® technology improve fixation in stemless cases?',
      'TRASER®''s open-pore 3D printing trabecular matrix provides an ideal scaffold for osteoblast migration and vascularization. In stemless configurations, the Humeral Core Cage with TRASER® delivers immediate mechanical stability and long-term bone preservation without invading the humeral canal.

Source: Permedica Orthopaedics – TRASER® Technology White Paper & Surgical Technique',
      3,
      NULL
    ),
    (
      'mirai_shoulder',
      'Is the MIRAI® System suitable for patients with metal hypersensitivity, and how durable is the VITAL-B® coating against peeling?',
      'Yes. The MIRAI® System is fully engineered for patients with documented hypersensitivity to nickel, cobalt, chromium, or heavy metals:
Metal Ion Barrier: VITAL-B® (TiNbN) forms a dense, biologically inert barrier that eliminates heavy metal ion migration into surrounding tissue.
Atomic-Level Bond & Anti-Delamination: Applied via advanced Physical Vapor Deposition (PVD), VITAL-B® forms an atomic-level metallurgical bond with the substrate rather than a conventional sprayed layer, guaranteeing the coating will not peel, flake, or delaminate under cyclic loading.
Ceramic-Like Hardness: Delivers extreme surface hardness (~2,000–2,500 Vickers Hardness) with ultra-low friction, dramatically reducing abrasive wear and debris.

Sources:
Permedica Orthopaedics – BIOLOY® Hypoallergenic Surface Modification Dossier
ISO 20502: Determination of Adhesion & Anti-Delamination of Ceramic Coatings
ISO 10993-18: Biological Evaluation of Medical Devices – Chemical Characterization & Ion Release Barriers',
      4,
      NULL
    ),
    (
      'mirai_shoulder',
      'What simulator wear testing supports the long-term durability of OrthoHouse’s MIRAI® System?',
      'The MIRAI® System features an innovative Material-Inversion Design where the articulating glenoid insert is a Ti6Al4V alloy PVD-coated with hard, scratch-resistant TiNbN (VITAL-B®), while the humeral head is made of highly cross-linked, vitamin E-infused UHMWPE (VITAL-E®). Under multi-million cycle simulator testing:
Test Parameters: In tests with a constant axial load of 756 N combined with angular motions, the system was run for up to 2.5 million cycles.
Proven Results: After 2.5 million cycles, the mean mass loss of the humeral head was recorded at just 0.68 mg.
Clinical Significance: The extremely low wear rate confirms that non-spherical, low-conforming designs reduce stress, translational forces, and frictional torque typically responsible for bearing degradation and aseptic loosening.

Sources:
Permedica S.p.A. – In-Vitro Biomechanical Wear Simulator Performance Report
The Bone & Joint Journal – Biomechanical & Tribological Evaluation Studies
National Center for Biotechnology Information (NCBI / PubMed) – Polyethylene Wear Dynamics in Shoulder Arthroplasty',
      5,
      NULL
    ),
    (
      'mirai_shoulder',
      'How does 3D MIRAI® Planning assist surgeons before surgery?',
      'OrthoHouse provides integrated 3D MIRAI® Planning software, allowing consultants to perform precise preoperative CT-based anatomical evaluation, optimal implant sizing, glenoid positioning, and offset restoration tailored to each patient’s unique anatomy.

Source: Permedica Orthopaedics – 3D MIRAI® Digital Preoperative Planning Suite',
      6,
      NULL
    ),
    (
      'mirai_shoulder',
      'Can UK consultants visit a reference center, attend workshops, or discuss clinical outcomes with peer surgeons?',
      'Yes. OrthoHouse maintains active clinical reference networks across Europe and the Middle East. We facilitate peer-to-peer discussions, Cadaver workshops, clinical observation sessions, and academic data sharing with leading consultants using the system.

Source: OrthoHouse Medical Education & Clinical Events Portal',
      7,
      NULL
    ),
    (
      'osteosynt',
      'What is OSTEOSYNT®?',
      'OSTEOSYNT® is a family of synthetic bone substitute products, utilising the ultimate generation of biphasic bioceramics, containing Hydroxyapatite and β-Tricalcium Phosphate. It is highly biocompatible due to its unique nanostructure, which features micro, meso, and macro intercommunicating pores, as well as its unmatched surface topography that enhances cell adhesion, proliferation, and differentiation. Both osteoconductive and osteoinductive, OSTEOSYNT® allows for controlled bone remodelling and resorption. OSTEOSYNT®''s unique chemical composition is both biomimetic and bioactive, allowing continuity between the existing bone and the new bone.

OSTEOSYNT® is widely used across orthopaedics, dentistry, plastic, and maxillofacial surgery to repair, reconstruct, or recover bone loss.

The Brazilian nanotechnology company, Eincobio, manufactures OSTEOSYNT®.',
      1,
      NULL
    ),
    (
      'osteosynt',
      'What makes OSTEOSYNT® different?',
      'As the composition is very similar to human bone matrix, OSTEOSYNT® acts as a scaffold for the formation of new bone tissue and is gradually replaced according to the metabolic activity of each patient. OSTEOSYNT® provides greater efficiency due to its chemical and unique physical characteristics.',
      2,
      '/assets/faqs/osteosynt-characteristics.png'
    ),
    (
      'osteosynt',
      'What forms does it come in?',
      'Injectable (pre-hydrated)
Granules
Spheres
Blocks and wedges
Cervical blocks and craniotomy buttons

Please note: Blocks and wedges can be cut to size, and custom shapes are available upon request (with a lead time of approximately 4 weeks).',
      3,
      NULL
    ),
    (
      'osteosynt',
      'What indications is OSTEOSYNT® approved for?',
      'OSTEOSYNT® is used across orthopedics, dentistry, plastic, and maxillofacial surgery to repair, reconstruct, or recover bone loss. OSTEOSYNT® has been used for over 40 years in infections, revision surgery, spine deformities, fractures, fusions, revision prosthesis, pseudo arthritis, and more.',
      4,
      NULL
    ),
    (
      'osteosynt',
      'Does OSTEOSYNT® contain antibiotics?',
      'OSTEOSYNT® does not contain antibiotics. Our products can be hydrated with saline, blood, or any liquid antibiotics, allowing surgeons complete control in the customised management of any infection(s) and to provide an option for patients with specific allergies, intolerances, or in cases of specific antibiotic resistance.',
      5,
      NULL
    ),
    (
      'osteosynt',
      'What are the biological contamination risks?',
      'OSTEOSYNT® is 100% synthetic, giving you peace of mind by eliminating any of the risks associated with animal-derived (xenografts) or human donor materials (allografts).',
      6,
      NULL
    ),
    (
      'osteosynt',
      'Does OSTEOSYNT® provide immediate stability?',
      'OSTEOSYNT® is a bioactive ceramic that works differently from traditional bone cement. Our range of blocks and wedges has been manufactured to withstand high mechanical loads. OSTEOSYNT® blocks and wedges can stand up to 90 MPa of load, compared to cortical bone of approximately 100 MPa.',
      7,
      NULL
    ),
    (
      'osteosynt',
      'Can OSTEOSYNT® be seen on X-ray?',
      'OSTEOSYNT® is radio-opaque, so it can be clearly seen on X-ray.',
      8,
      NULL
    ),
    (
      'osteosynt',
      'How do I order?',
      'Please visit our Meet the Team page to speak with your local OrthoHouse representative.',
      9,
      NULL
    ),
    (
      'orthosintex',
      'What screw sizes are the foot and ankle systems?',
      'The Orthosintex Episcan portfolio offers screw systems in 2.7 mm, 3.5 mm, and 4.0 mm diameters, depending on the implant and procedure.',
      1,
      NULL
    ),
    (
      'orthosintex',
      'What is the main focus of the Orthosintex Episcan portfolio?',
      'The Orthosintex Episcan portfolio provides comprehensive fixation solutions for foot and ankle surgery. The range includes implants designed for forefoot, midfoot, and hindfoot procedures, as well as flatfoot correction, trauma, arthrodesis, osteotomies, and minimally invasive surgery (MIS).',
      2,
      NULL
    ),
    (
      'orthosintex',
      'Where are the products manufactured?',
      'All Orthosintex products are designed, researched, and manufactured in Italy. 100% of the research, development, and manufacturing takes place within Orthosintex''s dedicated manufacturing facilities, ensuring high-quality standards and full control of the production process.',
      3,
      NULL
    ),
    (
      'orthosintex',
      'What foot and ankle procedures can the Orthosintex portfolio support?',
      'The portfolio supports a wide range of foot and ankle procedures, including:
Hallux valgus correction
Arthrodesis
Osteotomies
Fracture fixation
Flatfoot reconstruction
Calcaneal osteotomies
Minimally invasive foot surgery (MIS)',
      4,
      NULL
    ),
    (
      'orthosintex',
      'Are our products MHRA registered?',
      'Yes. Orthosintex Episcan products are registered with the UK''s Medicines and Healthcare products Regulatory Agency (MHRA) for use within the UK.',
      5,
      NULL
    ),
    (
      'orthosintex',
      'Are the products sterile?',
      'Yes. All Orthosintex Episcan implants are supplied sterile and ready for use, helping to support efficient theatre workflow and minimise preparation time.',
      6,
      NULL
    ),
    (
      'orthosintex',
      'What material are Orthosintex implants made from?',
      'Most Orthosintex implants are manufactured from Titanium Grade 5 (Ti-6Al-4V) or Titanium Grade 2, depending on the implant. Titanium is selected for its excellent strength, corrosion resistance, biocompatibility, and compatibility with orthopaedic applications.',
      7,
      NULL
    ),
    (
      'orthosintex',
      'Are the screws locking, non-locking, or both?',
      'We provide cortical non-locking and locking screws for 2.7mm, 3.5mm, and 4.0mm locking screw for the VCP plate.',
      8,
      NULL
    )
) AS v(category, question, answer, display_order, answer_image_url);
