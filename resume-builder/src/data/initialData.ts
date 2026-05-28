import type {
  Basics,
  Experience,
  Project,
  Education,
  Certification,
  ResumeTargeting
} from "../types/resume"

export const initialBasics: Basics = {
  name: "Anas Parekh",
  phone: "075738 12440",
  email: "anasparekh5@gmail.com",
  linkedin: "linkedin.com/in/anasparekh",
  portfolio: "resji.com/anasparekh",
  location: "Ahmedabad, Gujarat, India",
  objective:
    "iOS developer with hands-on experience shipping production apps to the App Store and building reliable, user-focused mobile experiences with Swift. Comfortable collaborating with remote cross-functional teams to deliver API-driven, data-rich products with real-time and secure mobile features. Focused on creating thoughtful digital experiences that solve real user problems.",
  skills:
    "Swift, Xcode, UIKit, SwiftUI, CocoaPods, RESTful APIs & JSON Parsing, Firebase, Realtime Database, BLE (Bluetooth Low Energy), Model-View-Controller (MVC), Combine Framework, async/await (familiar), GCD (familiar), Swift Concurrency (familiar), Test-Driven Development, Push Notifications, App Store Deployment, Socket Communication, In-App Purchases, Problem-Solving & Debugging, Agile Development, Communication & Collaboration, Product Thinking, Adaptability & Continuous Learning",
  languages: "English - Advanced (B2+)\nHindi - Fluent"
}

export const initialExperience: Experience[] = [
  {
    company: "smartData Enterprises Inc",
    role: "iOS Developer – Associate Level 3",
    location: "Remote",
    start: "Aug 2025",
    end: "Present",
    bullets: [
      "Worked on enterprise-level iOS applications using Swift and UIKit, focusing on scalable and high-performance mobile solutions.",
      "Integrated Polar SDK for real-time heart rate monitoring, enabling seamless BLE-based sensor connectivity within fitness workflows.",
      "Implemented advanced BLE controls including device scanning, pairing, connection state handling, and live data streaming while coordinating responsive UI updates with background device workflows.",
      "Developed production modules including real-time socket communication, subscription flows, and feature-based access control across API-driven mobile experiences.",
      "Integrated REST APIs and backend services to ensure smooth data synchronization and reliable app performance.",
      "Collaborated in Agile cycles with daily progress updates and weekly deliverable builds."
    ]
  },
  {
    company: "Amin Softtech LLP",
    role: "iOS Developer",
    location: "",
    start: "Jun 2022",
    end: "Jun 2025",
    bullets: [
      "Developed and launched 10+ iOS applications on the App Store, amassing 100,000+ total downloads.",
      "Leveraged UIKit and Combine to enhance UI performance, achieving a 30% boost in user engagement.",
      "Integrated RESTful APIs and asynchronous data flows across iOS features, improving data retrieval speed by 25%.",
      "Optimized codebase leading to 40% reduction in application load time.",
      "Conducted unit and UI testing ensuring seamless feature rollout; achieved 98% user satisfaction.",
      "Built reusable component libraries that streamlined future development by 50%.",
      "Contributed to Agile cycles, improving project delivery efficiency by 20%."
    ]
  }
]

export const initialProjects: Project[] = [
  {
    name: "CalmTrade",
    desc: "Trading wellness application for day traders, combining biometric-supported wellness workflows with real-time, API-driven data and performance insights.",
    skills: "Core Data · Polar SDK · SwiftUI · Swift · UIKit · REST APIs · Socket.IO · BLE"
  },
  {
    name: "First Face",
    desc: "Full-featured mobile solution for fashion show teams, streamlining castings, fittings, look orders, and show timing.",
    skills: "Xcode · Swift · UIKit · MVC · REST APIs · Firebase · Push Notifications"
  },
  {
    name: "CLIQK",
    desc: "Privacy-focused social platform with secure invite-only ecosystem for connecting and sharing content.",
    skills: "Xcode · Swift · UIKit · End-to-End Encryption · REST API"
  },
  {
    name: "ChatAlif",
    desc: "Arabic-language AI assistant with full Arabic UI for task management and conversational chat.",
    skills: "Xcode · Swift · UIKit · Arabic Localization · AI Chat · In-App Purchases"
  },
  {
    name: "WINGR",
    desc: "Social dating app with innovative matchmaking to address miscommunication and awkward matches.",
    skills: "iOS · Firebase · Swift · Xcode"
  },
  {
    name: "MND Movers N Dolly",
    desc: "UI for three moving and delivery apps with REST API and Firebase integration.",
    skills: "iOS · Xcode · Swift · MVC · Mapbox"
  },
  {
    name: "Fettle",
    desc: "Fitness coaching platform for building workout plans and tracking client progress.",
    skills: "iOS · Swift · UIKit · Firebase"
  },
  {
    name: "STUUDJE",
    desc: "All-in-one study app with notes, book summaries, tutoring, and a peer-to-peer marketplace.",
    skills: "Xcode · Swift · UIKit · Firebase · REST APIs"
  },
  {
    name: "Bookbag",
    desc: "School app for parents with events, homework, and notices plus role-based posting.",
    skills: "iOS · Swift · Xcode"
  }
]

export const initialEducation: Education[] = [
  {
    degree: "B.Tech in Information Technology",
    school: "Silver Oak University",
    start: "Aug 2022",
    end: "Jun 2025"
  },
  {
    degree: "HSC",
    school: "St. Xavier's High School Mirzapur",
    start: "Jun 2020",
    end: "Apr 2022"
  },
  {
    degree: "SSC",
    school: "St. Xavier's High School Mirzapur",
    start: "Jul 2019",
    end: "Jun 2020"
  }
]

export const initialCertifications: Certification[] = [
  {
    name: "AI Tools Workshop",
    issuer: "be10x",
    date: "Jun 2025"
  },
  {
    name: "Problem Solving (Basic) Certificate",
    issuer: "HackerRank",
    date: "May 2025"
  }
]

export const initialTargeting: ResumeTargeting = {
  jobDescription: "",
  mode: "product-ios",
  targetRole: "iOS Engineer",
  companyType: "Product company or global startup",
  lastOptimizedAt: ""
}
