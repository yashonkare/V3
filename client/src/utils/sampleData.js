/**
 * High-fidelity sample dataset for testing and offline demo reliability
 * Follows the approved CaseBriefData JSON schema
 */
export const SAMPLE_JUDGMENT_BRIEF = {
  documentMetadata: {
    filename: "Criminal_Appeal_1234_2021_SC_Acquittal.pdf",
    totalPages: 6,
    fileSizeKb: 340
  },
  caseCategory: {
    category: "Criminal",
    reason: "Criminal appeal challenging conviction and life sentence under Section 302 of the Indian Penal Code."
  },
  courtMetadata: {
    courtName: "Supreme Court of India",
    caseNumber: "Criminal Appeal No. 1234 of 2021",
    dateOfJudgment: "14 October 2022",
    judges: ["Justice D.Y. Chandrachud", "Justice Hima Kohli"]
  },
  parties: [
    {
      name: "Ramesh Kumar & Another",
      role: "Appellant",
      notes: "Convicted accused challenging High Court order confirming life imprisonment"
    },
    {
      name: "State of Maharashtra",
      role: "Respondent",
      notes: "Represented by Standing Counsel for the State"
    }
  ],
  laws: [
    {
      act: "Indian Penal Code, 1860",
      section: "Section 302",
      context: "Discussed by the court",
      explanation: "Deals with punishment for murder; examined circumstantial test standards."
    },
    {
      act: "Indian Evidence Act, 1872",
      section: "Section 27",
      context: "Applied / relied on by the court",
      explanation: "Recovery of allegedly incriminating weapon rejected due to lack of independent panchas."
    },
    {
      act: "Code of Criminal Procedure, 1973",
      section: "Section 313",
      context: "Mentioned",
      explanation: "Examination of the accused; failure of prosecution to put incriminating circumstances."
    }
  ],
  summary: {
    plainEnglish: "The Supreme Court heard an appeal by two appellants convicted of murder based solely on circumstantial evidence. The prosecution alleged that the appellants were last seen with the deceased and later recovered the weapon of offence. Upon close examination, the Supreme Court held that the prosecution failed to establish an unbroken chain of circumstances linking the accused to the crime.",
    coreIssues: [
      "Whether the circumstantial evidence established a complete chain unerringly pointing to the guilt of the accused.",
      "Whether the recovery of the weapon under Section 27 of the Evidence Act was legally admissible without independent panch witnesses.",
      "Whether the 'last seen' doctrine could solely sustain a conviction when an unexplained time gap existed."
    ]
  },
  analysis: {
    partyArguments: [
      {
        party: "Appellants",
        argument: "Contended that there was an unexplained delay of 18 hours between the alleged 'last seen' sighting and the discovery of the body, breaking the chain of circumstance."
      },
      {
        party: "State / Prosecution",
        argument: "Argued that the recovery of the blood-stained weapon upon appellant's disclosure statement and testimony of PW-3 sufficiently corroborated the conviction."
      }
    ],
    courtReasoning: [
      "The court reiterated the golden principles of circumstantial evidence laid down in Sharad Birdhichand Sarda: the circumstances must be firmly established and exclude every possible hypothesis except guilt.",
      "The recovery under Section 27 was found tainted because the independent panch witness turned hostile and the police memo lacked contemporaneous time logs.",
      "A long gap of time between the deceased being seen alive with the accused and the death creates a reasonable possibility of third-party involvement."
    ],
    finalOutcome: {
      status: "Decided",
      order: "Appeal allowed. The impugned judgment of the High Court is set aside. The appellants are acquitted of all charges and directed to be released from custody forthwith.",
      isInterim: false
    }
  },
  evidence: [
    {
      supportsFinding: "Strict Standard for Circumstantial Evidence",
      quote: "Unless the circumstances from which an inference of guilt is drawn are cogently and firmly established, leaving no gap for a hypothesis of innocence, conviction cannot stand.",
      pageNumber: 4
    },
    {
      supportsFinding: "Rejection of Weapon Recovery under Sec 27",
      quote: "The alleged recovery memo fails the test of credibility as no independent witness from the locality supported the search or seizure.",
      pageNumber: 5
    },
    {
      supportsFinding: "Operative Acquittal Order",
      quote: "The appeal is accordingly allowed. The conviction of the appellants is set aside and they shall be set at liberty forthwith if not required in any other case.",
      pageNumber: 6
    }
  ],
  uncertainties: [
    "Exact post-mortem time of death remained ambiguous in medical testimony.",
    "First Information Report (FIR) recording officer's name not found in extracted text."
  ]
};

export const SAMPLE_CIVIL_BRIEF = {
  documentMetadata: {
    filename: "Civil_Writ_Petition_4892_2023_HC_LandAcquisition.pdf",
    totalPages: 4,
    fileSizeKb: 210
  },
  caseCategory: {
    category: "Civil",
    reason: "Writ petition seeking quashing of land acquisition notification for urban road expansion."
  },
  courtMetadata: {
    courtName: "High Court of Delhi",
    caseNumber: "W.P.(C) 4892/2023",
    dateOfJudgment: "22 February 2024",
    judges: ["Justice Prathiba M. Singh"]
  },
  parties: [
    {
      name: "Anand Swaroop & Ors.",
      role: "Petitioner",
      notes: "Freehold landowners in South Delhi"
    },
    {
      name: "Delhi Development Authority & Anr.",
      role: "Respondent",
      notes: "Municipal authority acquiring land for urban highway corridor"
    }
  ],
  laws: [
    {
      act: "Right to Fair Compensation and Transparency in Land Acquisition Act, 2013",
      section: "Section 24(2)",
      context: "Applied / relied on by the court",
      explanation: "Lapsing of acquisition proceedings due to non-payment of compensation and failure to take physical possession."
    },
    {
      act: "Constitution of India",
      section: "Article 226",
      context: "Discussed by the court",
      explanation: "Extraordinary writ jurisdiction exercised to enforce statutory lapse."
    }
  ],
  summary: {
    plainEnglish: "The petitioners approached the High Court seeking a declaration that land acquisition proceedings initiated over their ancestral land had lapsed because neither physical possession was taken nor compensation deposited for over five years.",
    coreIssues: [
      "Whether the acquisition proceedings lapsed under Section 24(2) of the 2013 Act.",
      "Whether the DDA can claim constructive possession merely by drawing a site panchnama."
    ]
  },
  analysis: {
    partyArguments: [
      {
        party: "Petitioners",
        argument: "Submitted that they remain in actual physical possession and no compensation was ever credited to their bank accounts."
      },
      {
        party: "DDA",
        argument: "Claimed compensation was deposited into the government treasury and symbolic possession was recorded."
      }
    ],
    courtReasoning: [
      "The court observed that treasury deposit does not fulfill the requirement of offering or tendering compensation to landowners.",
      "Physical possession was never divested from the petitioners as established by current municipal electricity records."
    ],
    finalOutcome: {
      status: "Decided",
      order: "Writ petition allowed. Land acquisition proceedings declared lapsed. Respondents restrained from interfering with petitioners' possession.",
      isInterim: false
    }
  },
  evidence: [
    {
      supportsFinding: "Statutory Lapse of Acquisition",
      quote: "In view of the settled position that neither possession was taken nor compensation tendered, Section 24(2) operates to invalidate the notification.",
      pageNumber: 3
    }
  ],
  uncertainties: [
    "Subordinate revenue officer's report date was not found in extracted text."
  ]
};
