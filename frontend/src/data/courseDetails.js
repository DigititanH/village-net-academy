/** Extended course detail content keyed by URL slug */

export function courseSlug(title) {
  return title
    .toLowerCase()
    .replace(/\[beta\]\s*/i, "")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
}

export const courseDetailsBySlug = {
  "it-customer-support-basics": {
    emoji: "🎧",
    pace: "Self-paced with instructor support",
    price: "Free",
    enrollUrl: "https://www.netacad.com/career-paths/it-support-specialist?courseLang=en-US",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco IT Support Specialist Career Path",
      description:
        "Delivered through the Cisco Networking Academy as the first course in the 4-course IT Support Specialist Career Path that prepares learners for the CCST IT Support certification and entry-level IT roles.",
      badges: ["Career Path Course 1 of 4", "CCST IT Support Aligned", "Self-Paced Online"],
    },
    overview:
      "Growth in the tech sector continues to create opportunities for skilled IT workers. Customer support roles offer an excellent entry point if you are looking to get started in tech. This course prepares you for entry-level IT support roles. You'll develop a foundational understanding of help desk operations — covering effective customer communication, technical troubleshooting, and the use of remote support tools. You'll gain experience managing and resolving issues in diverse computing environments and handle real-world scenarios with hands-on exercises that reinforce both your customer service and technical skills. This is the first course in the Cisco IT Support Specialist Career Path leading to CCST IT Support certification.",
    learnings: [
      "Apply help desk concepts and ticketing workflows",
      "Communicate professionally with customers in technical contexts",
      "Document customer interactions and incidents accurately",
      "Apply a structured troubleshooting process to resolve issues",
      "Use remote access tools to support end users",
      "Leverage AI assistants and reference resources during troubleshooting",
      "Diagnose and resolve common application issues",
    ],
    prerequisites: [
      "No prior IT experience required",
      "Basic computer literacy",
      "Interest in starting a career in IT support",
    ],
    certification:
      "Certificate of Completion in IT Customer Support Basics (Cisco Networking Academy)",
    curriculum: [
      {
        title: "Module 1: Customer Service in IT Support",
        topics: ["Help desk concepts", "Professional communication skills", "Customer interaction and documentation"],
      },
      {
        title: "Module 2: Processes and Tools for Troubleshooting",
        topics: [
          "The troubleshooting process",
          "Remote access support",
          "Researching with AI and troubleshooting tools",
          "Common application issues",
        ],
      },
      {
        title: "Final Assessment",
        topics: ["End-of-course survey", "IT Customer Support Basics final exam"],
      },
    ],
  },
  "computer-hardware-basics": {
    emoji: "🖥️",
    pace: "Self-paced with instructor support",
    price: "Free",
    enrollUrl: "https://www.netacad.com/career-paths/network-technician?courseLang=en-US",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco Networking Academy Computer Hardware Basics",
      description:
        "Delivered through the Cisco Networking Academy with hands-on labs and interactive content. Aligns with the IT Essentials curriculum and serves as a foundation for further IT, networking, and cybersecurity learning paths.",
      badges: ["3 Hands-On Labs", "Personal Computers, Laptops & Mobile Devices Badges", "Self-Paced Online"],
    },
    overview:
      "Computers are everywhere — your smartphone is a mini-computer, a server is a super-computer, and cars, smart TVs, and game consoles all contain computers. Having a basic understanding of these devices and how they work is critical for success in today's digital world, and this course is a great starting point for any IT career. Computer Hardware Basics explores the fundamentals of computers and mobile devices, the components that comprise them, how they work, and basic troubleshooting tools and techniques — including 3 hands-on labs covering PC disassembly and assembly.",
    learnings: [
      "Apply general, fire, and personal computer safety procedures",
      "Disassemble and reassemble a personal computer safely",
      "Install motherboard components, drives, adapter cards, and cables",
      "Identify laptop components and configure wireless connectivity",
      "Perform preventive maintenance on laptops and mobile devices",
      "Describe the hardware that makes up smartphones, tablets, and other mobile devices",
    ],
    prerequisites: [
      "No prior IT experience required",
      "Basic computer literacy",
      "Curiosity about how computers and mobile devices work",
    ],
    certification:
      "Certificate of Completion in Computer Hardware Basics (Cisco Networking Academy) — earn Personal Computers, Laptops, and Mobile Devices badges.",
    curriculum: [
      {
        title: "Module 1: Safety and PC Fundamentals",
        topics: [
          "General, fire, and personal computer safety procedures",
          "Personal computer components and how they work",
          "Basic troubleshooting tools and techniques",
        ],
      },
      {
        title: "Module 2: PC Assembly and Configuration",
        topics: [
          "Disassemble and reassemble a personal computer safely",
          "Install motherboard components, drives, adapter cards, and cables",
          "Hands-on lab: PC disassembly and assembly",
        ],
      },
      {
        title: "Module 3: Laptops and Mobile Devices",
        topics: [
          "Identify laptop components and configure wireless connectivity",
          "Perform preventive maintenance on laptops and mobile devices",
          "Smartphone, tablet, and mobile device hardware",
        ],
      },
      {
        title: "Hands-On Labs & Assessment",
        topics: [
          "3 interactive hands-on labs",
          "End-of-course assessment",
          "Badge: Personal Computers, Laptops & Mobile Devices",
        ],
      },
    ],
  },
  "linux-unhatched": {
    emoji: "🐧",
    pace: "Self-paced with instructor support",
    price: "Free",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Powered by Cisco Networking Academy & NDG",
      description:
        "Delivered through the Cisco Networking Academy in collaboration with Network Development Group (NDG). Hands-on virtual machine activities give you safe, browser-based practice with real Linux systems.",
      badges: ["Hands-On Virtual Labs", "Pathway to Linux Essentials & LPI Certification", "Self-Paced Online"],
    },
    overview:
      "Want to start a career at the cutting edge of innovation? Linux is an open-source operating system used by organizations worldwide and is the driving force behind technological progress in supercomputers, cloud computing, and much more. In as little as eight hours, you can learn the essentials of Linux while being guided step-by-step through a series of hands-on virtual machine activities. After completing this course you are already on your way to certification — continue on to Linux Essentials or Linux 1 to keep building toward a Linux Professional Institute certification. This course is developed in collaboration with Network Development Group (NDG).",
    learnings: [
      "Understand what Linux is and how it is used across industries",
      "Navigate the Linux command line and file system with confidence",
      "Run basic commands to view, create, move, and remove files",
      "Use the built-in help system to learn new commands",
      "Practice Linux skills in a guided virtual machine environment",
      "Prepare for the Linux Essentials and Linux 1 follow-on courses",
    ],
    prerequisites: [
      "No prior Linux experience required",
      "Basic computer literacy",
      "Web browser and internet access for the virtual machine labs",
    ],
    certification:
      "Certificate of Completion in Linux Unhatched — earn the Linux Unhatched badge from Cisco Networking Academy & NDG.",
    curriculum: [
      {
        title: "Module 1: Introduction to Linux",
        topics: ["What Linux is and where it runs", "Open-source software concepts", "Linux distributions and use cases"],
      },
      {
        title: "Module 2: Linux Command Line Basics",
        topics: ["The Linux shell", "Navigating the file system", "Using ls, cd, pwd, and the help system"],
      },
      {
        title: "Module 3: Working with Files",
        topics: ["Viewing file contents", "Creating, copying, moving, and removing files", "File permissions overview"],
      },
      {
        title: "Module 4: Hands-On Practice",
        topics: [
          "Guided virtual machine activities",
          "Applying commands to real scenarios",
          "Next steps toward Linux certification",
        ],
      },
    ],
  },
  "hardware-and-upgrade-support": {
    emoji: "🛠️",
    pace: "Self-paced with instructor support",
    price: "Free",
    enrollUrl: "https://www.netacad.com/career-paths/it-support-specialist?courseLang=en-US",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco IT Support Specialist Career Path",
      description:
        "Delivered through the Cisco Networking Academy as the fourth and final course in the IT Support Specialist Career Path. Together with the other three courses it prepares learners for the CCST IT Support certification and entry-level IT roles.",
      badges: ["Career Path Course 4 of 4", "CCST IT Support Aligned", "Hands-On Hardware Skills"],
    },
    overview:
      "Have you ever wondered what goes on inside your computer or wished you could fix a technical problem yourself? When hardware fails, IT support specialists are the experts who diagnose and resolve the issue. In this course you will learn the core skills that IT support specialists use every day — troubleshooting common hardware problems from a faulty power supply to a failing hard drive, following safety procedures, identifying the purpose of every port and cable, and installing and upgrading key components like memory (RAM) and storage drives to boost system performance. This is the final course in the Cisco IT Support Specialist Career Path leading to CCST IT Support certification.",
    learnings: [
      "Apply basic safety procedures when working with computer hardware",
      "Use device information tools to inspect system configuration",
      "Identify common ports, cables, and connectors",
      "Diagnose and resolve common PC hardware issues",
      "Evaluate system architecture and component compatibility for upgrades",
      "Install and upgrade memory, storage, and adapter cards",
      "Manage drivers using Device Manager and dispose of e-waste responsibly",
    ],
    prerequisites: [
      "Computer Hardware Basics or equivalent recommended",
      "Comfort working with the inside of a PC",
      "Basic understanding of operating systems",
    ],
    certification:
      "Certificate of Completion in Hardware and Upgrade Support (Cisco Networking Academy) — final course in the IT Support Specialist Career Path.",
    curriculum: [
      {
        title: "Module 1: Troubleshooting Common Hardware Issues",
        topics: [
          "Basic safety procedures",
          "Device information tools",
          "Ports and cables",
          "Diagnosing hardware issues",
        ],
      },
      {
        title: "Module 2: Common Hardware Upgrades",
        topics: [
          "System architecture and compatibility",
          "Core hardware components",
          "Interfaces and expansion technologies",
          "Driver management and Device Manager",
          "E-waste and responsible component disposal",
        ],
      },
      {
        title: "Final Assessment",
        topics: ["End-of-course survey", "Hardware and Upgrade Support final exam"],
      },
    ],
  },
  "operating-systems-support": {
    emoji: "💻",
    pace: "Self-paced with instructor support",
    price: "Free",
    enrollUrl: "https://www.netacad.com/career-paths/it-support-specialist?courseLang=en-US",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco IT Support Specialist Career Path",
      description:
        "Delivered through the Cisco Networking Academy as the second course in the IT Support Specialist Career Path that prepares learners for the CCST IT Support certification and entry-level IT roles.",
      badges: ["Career Path Course 2 of 4", "CCST IT Support Aligned", "Self-Paced Online"],
    },
    overview:
      "IT support is a fulfilling career that lets you solve technical problems and make technology accessible and understandable for customers. Operating Systems Support teaches foundational customer support knowledge — learn to diagnose and resolve common IT issues efficiently by troubleshooting Windows, macOS, and mobile operating systems. Address challenges such as app crashes, boot failures, and connectivity issues, and assist users with software installations and compatibility across platforms. This is the second course in the Cisco IT Support Specialist Career Path leading to CCST IT Support certification.",
    learnings: [
      "Troubleshoot Windows display, power, boot, and startup issues",
      "Assist users with accessibility features and cloud-based backup tools",
      "Secure and maintain the integrity of Windows systems",
      "Use Linux and macOS tools, best practices, and virtualization basics",
      "Run basic Linux commands used in troubleshooting",
      "Troubleshoot macOS and mobile operating systems",
      "Manage mobile OS security and resolve common mobile app issues",
    ],
    prerequisites: [
      "IT Customer Support Basics recommended",
      "Familiarity with Windows desktop environments",
      "Basic computer literacy",
    ],
    certification:
      "Certificate of Completion in Operating Systems Support (Cisco Networking Academy) — earn the Operating Systems Support badge.",
    curriculum: [
      {
        title: "Module 1: Troubleshooting the Windows Operating System",
        topics: [
          "Display and power issues",
          "Accessibility features",
          "Securing and maintaining Windows system integrity",
          "Cloud-based backup tools",
          "Boot and startup issues",
        ],
      },
      {
        title: "Module 2: Troubleshooting Linux and macOS",
        topics: [
          "Linux and macOS tools and features",
          "Linux and macOS best practices",
          "Linux virtualization",
          "Basic Linux commands used in troubleshooting",
          "Troubleshooting macOS",
        ],
      },
      {
        title: "Module 3: Troubleshooting Mobile Devices and Applications",
        topics: [
          "Mobile device features",
          "Troubleshooting process for mobile devices",
          "Managing mobile OS security",
          "Common issues and solutions for mobile devices",
          "Mobile device apps and the cloud",
        ],
      },
      {
        title: "Final Assessment",
        topics: ["End-of-course survey", "Operating Systems Support final exam"],
      },
    ],
  },
  "security-and-connectivity-support": {
    emoji: "🛡️",
    pace: "Self-paced with instructor support",
    price: "Free",
    enrollUrl: "https://www.netacad.com/career-paths/it-support-specialist?courseLang=en-US",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco IT Support Specialist Career Path",
      description:
        "Delivered through the Cisco Networking Academy as the third course in the IT Support Specialist Career Path that prepares learners for the CCST IT Support certification and entry-level IT roles.",
      badges: [
        "Career Path Course 3 of 4",
        "CCST IT Support Aligned",
        "Networking & Cybersecurity Foundations",
      ],
    },
    overview:
      "From how we shop to how we work, our modern world is built on digital connections — and every connection is also a potential vulnerability. In this course you will diagnose and resolve a wide range of connectivity issues, from peripheral devices to shared network resources. Beyond technical troubleshooting, you will build a strong foundation in cybersecurity by learning to identify common security threats, recognise social engineering tactics, and apply company policies to protect sensitive data. After completing this course you will be able to provide effective, secure, and responsive front-line IT support. This is the third course in the Cisco IT Support Specialist Career Path leading to CCST IT Support certification.",
    learnings: [
      "Troubleshoot directory services, shared drives, and user connectivity issues",
      "Resolve peripheral connectivity problems",
      "Configure and troubleshoot wired and wireless networks",
      "Apply IP addressing, DNS, DHCP, and firewall concepts",
      "Use command-line tools to verify and troubleshoot connectivity",
      "Identify threat actors, malware, and common network attacks",
      "Apply security awareness, incident response, and data protection practices",
    ],
    prerequisites: [
      "IT Customer Support Basics and Operating Systems Support recommended",
      "Basic understanding of networking concepts",
      "Comfort using Windows and command-line tools",
    ],
    certification:
      "Certificate of Completion in Security and Connectivity Support (Cisco Networking Academy) — earn the Security and Connectivity Support badge.",
    curriculum: [
      {
        title: "Module 1: Troubleshooting Common Services and Peripheral Connectivity Issues",
        topics: [
          "Directory services and shared drives",
          "User connectivity issues",
          "Peripheral connectivity",
        ],
      },
      {
        title: "Module 2: Troubleshooting Common Network Connectivity Issues",
        topics: [
          "Network types",
          "Wired and wireless networks",
          "IP addressing",
          "Communicating between networks",
          "DNS and DHCP",
          "Firewalls",
          "Using commands to verify and troubleshoot connectivity",
        ],
      },
      {
        title: "Module 3: Troubleshooting Common Security Issues",
        topics: [
          "Current state of cybersecurity",
          "Threat actors",
          "Malware",
          "Common network attacks",
          "Help desk technician security awareness",
          "Security incident response",
          "Protecting data",
        ],
      },
      {
        title: "Final Assessment",
        topics: ["End-of-course survey", "Security and Connectivity Support final exam"],
      },
    ],
  },
  "introduction-to-cybersecurity": {
    emoji: "🛡️",
    pace: "Self-paced with instructor support",
    price: "Free",
    enrollUrl: "https://www.netacad.com/courses/introduction-to-cybersecurity?courseLang=en-US",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco Networking Academy Introduction to Cybersecurity",
      description:
        "Delivered through the Cisco Networking Academy as an entry point into the cybersecurity learning pathway. Aligns to early-career awareness of threats, defenders, and security roles.",
      badges: ["Beginner Friendly", "Career Exploration", "Self-Paced Online"],
    },
    overview:
      "Cybersecurity is one of the fastest-growing fields in technology. In this introductory course you'll learn what cyber attacks look like, who launches them, and how organisations defend themselves. You'll explore career options in cybersecurity, discover the skills employers look for, and complete short hands-on activities that demystify the day-to-day work of a security professional. A great first step for anyone curious about a future-proof career protecting people, data, and systems.",
    learnings: [
      "Describe the global need for cybersecurity professionals",
      "Identify common cyber threats, attacks, and vulnerabilities",
      "Explain how attackers think and how defenders respond",
      "Recognise tools and processes used to protect data and systems",
      "Explore cybersecurity career pathways and certifications",
    ],
    prerequisites: [
      "No prior cybersecurity experience required",
      "Basic computer literacy",
      "Curiosity about how the internet and digital systems are protected",
    ],
    certification:
      "Certificate of Completion in Introduction to Cybersecurity (Cisco Networking Academy)",
    curriculum: [
      {
        title: "Module 1: The Need for Cybersecurity",
        topics: [
          "Why cybersecurity matters",
          "Personal data and organizational data",
          "Real-world cyber attacks",
        ],
      },
      {
        title: "Module 2: Attacks, Concepts and Techniques",
        topics: [
          "Malware and malicious code",
          "Common attack methods",
          "Vulnerabilities and impact",
        ],
      },
      {
        title: "Module 3: Protecting Your Data and Privacy",
        topics: [
          "Protecting your devices and network",
          "Data maintenance and backups",
          "Two-factor authentication and password hygiene",
        ],
      },
      {
        title: "Module 4: Protecting the Organization",
        topics: [
          "Firewalls and security appliances",
          "Behaviour-based detection",
          "Cisco's approach to cybersecurity",
        ],
      },
      {
        title: "Module 5: Will Your Future Be in Cybersecurity?",
        topics: [
          "Legal and ethical issues",
          "Cybersecurity careers and certifications",
          "Next-step learning paths",
        ],
      },
    ],
  },
  "cybersecurity-essentials": {
    emoji: "🔐",
    pace: "Instructor-led (Weekday evenings or Weekend classes)",
    price: "R 6,500",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco Networking Academy Cybersecurity Essentials",
      description:
        "Delivered through the Cisco Networking Academy with hands-on labs and Packet Tracer simulations. Forms a key building block on the path to CCST Cybersecurity and CyberOps Associate certifications.",
      badges: ["CCST Cybersecurity Aligned", "Hands-On Labs", "Industry Skills"],
    },
    overview:
      "Cybersecurity Essentials builds the foundational knowledge and hands-on skills required to start a career in cybersecurity. The course explores cybersecurity principles, the CIA triad, threat actors, cryptography, access control, defending devices and networks, and basic incident response. Through interactive labs and Cisco Packet Tracer activities you'll practise defending systems, encrypting data, and securing networks — preparing you for the CCST Cybersecurity and CyberOps Associate pathways.",
    learnings: [
      "Apply the CIA triad and core cybersecurity principles",
      "Classify threat actors, attack vectors, and malware",
      "Use cryptography to protect data at rest and in transit",
      "Implement access control and identity management",
      "Defend devices, applications, and networks against attack",
      "Respond to and recover from common security incidents",
    ],
    prerequisites: [
      "Introduction to Cybersecurity or equivalent recommended",
      "Basic networking and operating systems knowledge",
      "Comfort with the command line is helpful",
    ],
    certification:
      "Certificate of Completion in Cybersecurity Essentials (Cisco Networking Academy) — preparation for CCST Cybersecurity.",
    curriculum: [
      {
        title: "Module 1: Cybersecurity — A World of Wizards, Heroes and Criminals",
        topics: ["Cybersecurity domains", "Threat actors and motives", "The cybersecurity profession"],
      },
      {
        title: "Module 2: The Cybersecurity Sorcery Cube",
        topics: ["CIA triad", "States of data", "Security countermeasures"],
      },
      {
        title: "Module 3: Cybersecurity Threats, Vulnerabilities and Attacks",
        topics: ["Malware, social engineering, and attack types", "Wireless and mobile attacks", "Application attacks"],
      },
      {
        title: "Module 4: The Art of Protecting Secrets",
        topics: ["Cryptography fundamentals", "Symmetric and asymmetric encryption", "Hashing and digital signatures"],
      },
      {
        title: "Module 5: The Art of Ensuring Integrity",
        topics: ["Integrity controls", "Digital certificates and PKI", "Database integrity"],
      },
      {
        title: "Module 6: The Realm of Five Nines",
        topics: ["High availability", "System resilience and redundancy", "Incident response"],
      },
      {
        title: "Module 7: Fortifying the Kingdom",
        topics: ["Defending hosts, servers, networks", "Hardening configurations", "Physical and personnel security"],
      },
      {
        title: "Module 8: Joining the Order of Cybersecurity Specialists",
        topics: ["Frameworks and compliance", "Ethics and law", "Cybersecurity careers and certifications"],
      },
    ],
  },
  "ethical-hacker": {
    emoji: "🥷",
    pace: "Self-paced with instructor support",
    price: "Free",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco Networking Academy Ethical Hacker",
      description:
        "Delivered through the Cisco Networking Academy with hands-on Kali Linux labs covering the full offensive-security lifecycle. Builds practical skills aligned to penetration testing certifications and SOC red-team roles.",
      badges: ["Kali Linux & Metasploit Labs", "Penetration Testing Lifecycle", "PenTest+ / CEH Aligned"],
    },
    overview:
      "Step into the mindset of an attacker — legally and ethically. The Cisco Networking Academy Ethical Hacker course teaches the full offensive-security lifecycle: planning and scoping engagements, performing reconnaissance, scanning and enumeration, exploiting systems, attacking web and wireless targets, post-exploitation, and writing professional penetration test reports. You'll work with industry-standard tools such as Kali Linux, Nmap, Metasploit, and Burp Suite to uncover vulnerabilities before real cybercriminals do.",
    learnings: [
      "Plan and scope penetration tests with proper legal authorisation",
      "Conduct passive and active reconnaissance using OSINT and scanning tools",
      "Identify, analyse, and exploit common vulnerabilities",
      "Attack web applications, wireless networks, and cloud environments",
      "Perform post-exploitation, lateral movement, and privilege escalation",
      "Produce clear, prioritised penetration test reports for stakeholders",
    ],
    prerequisites: [
      "Cybersecurity Essentials, Network+ or CCNA-level knowledge",
      "Comfort with Linux command line",
      "Understanding of TCP/IP, common services, and OS fundamentals",
    ],
    certification:
      "Certificate of Completion in Ethical Hacker (Cisco Networking Academy) — preparation for CompTIA PenTest+ and EC-Council CEH.",
    curriculum: [
      {
        title: "Module 1: Introduction to Ethical Hacking and Penetration Testing",
        topics: ["Ethics, scope, and legal considerations", "Engagement planning", "Reporting overview"],
      },
      {
        title: "Module 2: Reconnaissance and Enumeration",
        topics: ["OSINT and passive recon", "Active scanning with Nmap", "Service and OS enumeration"],
      },
      {
        title: "Module 3: Vulnerability Identification",
        topics: ["Vulnerability scanning", "Analysing scan output", "Manual vulnerability research"],
      },
      {
        title: "Module 4: System and Network Attacks",
        topics: ["Exploitation with Metasploit", "Password attacks", "Lateral movement"],
      },
      {
        title: "Module 5: Web Application and API Attacks",
        topics: ["OWASP Top 10", "Burp Suite essentials", "Injection and authentication flaws"],
      },
      {
        title: "Module 6: Wireless, Cloud, and IoT Attacks",
        topics: ["Wi-Fi attacks", "Cloud-misconfiguration testing", "IoT and OT considerations"],
      },
      {
        title: "Module 7: Post-Exploitation and Reporting",
        topics: ["Persistence and pivoting", "Data exfiltration concepts", "Writing the penetration test report"],
      },
    ],
  },
  "cyberops-associate": {
    emoji: "📡",
    pace: "Instructor-led",
    price: "Free",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco CyberOps Associate Certification Path",
      description:
        "Delivered through the Cisco Networking Academy and aligned to the Cisco Certified CyberOps Associate exam blueprint and the NICE Cybersecurity Workforce framework. Includes 28 modules and 46 hands-on labs that simulate real SOC investigations.",
      badges: ["28 Modules · 46 Labs", "NICE Framework Aligned", "Instructor-Led SOC Training"],
    },
    overview:
      "Welcome to the thrilling world of cybersecurity, where you can combat cybercrime, outsmart cyber espionage, and tackle a wide range of networking threats. Gear up for the Cisco Certified CyberOps Associate certification and the in-demand skills needed to join a Security Operations Center (SOC) team. You'll learn how SOC teams detect and respond to security incidents and explore security concepts, monitoring, host-based analysis, network intrusion analysis, and security policies and procedures. The course aligns with the National Initiative for Cybersecurity Education (NICE) Cybersecurity Workforce framework and includes 46 hands-on labs across 28 modules.",
    learnings: [
      "Explain the role of the SOC and the day-to-day work of a Cybersecurity Analyst",
      "Work confidently with Windows, Linux, network protocols, and services from a defender's perspective",
      "Investigate attackers, their tools, and common threats including malware, DoS, and social engineering",
      "Apply network defense techniques: access control, threat intelligence, cryptography, and endpoint protection",
      "Monitor and analyse security data, evaluate alerts, and work with logs and SIEM data",
      "Apply the Cyber Kill Chain, Diamond Model, and incident response process to investigate intrusions",
      "Prepare for the Cisco Certified CyberOps Associate certification exam",
    ],
    prerequisites: [
      "Cybersecurity Essentials or equivalent knowledge",
      "Solid TCP/IP and network fundamentals (CCNA-level helpful)",
      "Comfort working in Linux and Windows environments",
    ],
    certification: "Preparation for the Cisco Certified CyberOps Associate certification",
    curriculum: [
      {
        title: "Modules 1–2: Threat Actors and SOC Defenders",
        topics: [
          "The Danger: war stories, threat actors and impact",
          "Fighters in the war against cybercrime",
          "The modern Security Operations Center",
        ],
      },
      {
        title: "Modules 3–4: Windows and Linux for SOC Analysts",
        topics: [
          "Windows architecture, configuration and security",
          "Linux basics, shell, servers and file system",
          "Working on Windows and Linux hosts",
        ],
      },
      {
        title: "Modules 5–10: Network Fundamentals",
        topics: [
          "Network protocols, Ethernet and IP (v4/v6)",
          "ARP, transport layer, connectivity verification",
          "Network services: DHCP, DNS, NAT, HTTP, email",
        ],
      },
      {
        title: "Modules 11–12: Network Communication & Security Infrastructure",
        topics: [
          "Network devices and wireless communications",
          "Network topologies and security devices",
          "Security services in the enterprise",
        ],
      },
      {
        title: "Modules 13–17: Threats and Attacks",
        topics: [
          "Attackers and their tools",
          "Malware, reconnaissance, access and social engineering",
          "DoS, buffer overflows and evasion; using AI to analyse malware",
          "Network monitoring; attacking the foundation and IP services",
        ],
      },
      {
        title: "Modules 18–20: Network Defense",
        topics: [
          "Defense-in-depth, security policies and standards",
          "Access control, AAA usage and operation",
          "Threat intelligence sources and services",
        ],
      },
      {
        title: "Modules 21–23: Cryptography and Endpoint Protection",
        topics: [
          "Integrity, confidentiality and public key cryptography",
          "PKI trust system and cryptography applications",
          "Antimalware, HIPS, application and endpoint security",
          "Network/server profiling, CVSS and ISMS",
        ],
      },
      {
        title: "Modules 24–25: Technologies, Protocols and Security Data",
        topics: [
          "Monitoring common protocols and security technologies",
          "Types of security data; end-device and network logs",
        ],
      },
      {
        title: "Modules 26–28: Analysing Alerts and Incident Response",
        topics: [
          "Sources of alerts and alert evaluation",
          "Working with network security data and common data platforms",
          "Digital forensics, Cyber Kill Chain and Diamond Model",
          "Incident response and exam preparation",
        ],
      },
      {
        title: "Certification Practice",
        topics: [
          "Cisco Cybersecurity Associate v1.2 Certification Practice Exam",
          "CyberOps Associate Practice Final exam",
          "Course Final Exam",
        ],
      },
    ],
  },
  "endpoint-security": {
    emoji: "💻",
    pace: "Self-paced with instructor support",
    price: "Free",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco Networking Academy Endpoint Security",
      description:
        "Delivered through the Cisco Networking Academy as part of the cybersecurity learning pathway. Provides the hands-on endpoint-defence skills that complement CyberOps Associate and Network Defense.",
      badges: ["Hands-On Endpoint Labs", "Windows & Linux Hardening", "Self-Paced Online"],
    },
    overview:
      "Endpoints — laptops, desktops, servers, mobiles, and IoT devices — are where attackers most often gain a foothold. This course covers operating system hardening for Windows and Linux, endpoint protection platforms, host-based firewalls and intrusion detection, malware defence, and network endpoint security. Hands-on labs give you experience applying controls, investigating endpoint events, and responding to compromise.",
    learnings: [
      "Harden Windows and Linux endpoints against common attacks",
      "Configure host-based firewalls, anti-malware, and HIDS",
      "Investigate suspicious endpoint behaviour and processes",
      "Apply patching, configuration, and asset management best practices",
      "Integrate endpoint telemetry into wider security monitoring",
    ],
    prerequisites: [
      "Cybersecurity Essentials or equivalent recommended",
      "Familiarity with Windows and Linux operating systems",
      "Basic networking knowledge",
    ],
    certification: "Certificate of Completion in Endpoint Security (Cisco Networking Academy)",
    curriculum: [
      {
        title: "Module 1: Network Security Foundations",
        topics: ["Threat landscape", "Defence-in-depth", "Endpoint role in the kill chain"],
      },
      {
        title: "Module 2: System and Endpoint Protection",
        topics: [
          "Operating system hardening",
          "Endpoint protection platforms",
          "Host-based firewalls and HIDS",
        ],
      },
      {
        title: "Module 3: Endpoint Vulnerability Assessment",
        topics: [
          "Patch and configuration management",
          "Vulnerability scanning of hosts",
          "Risk prioritisation",
        ],
      },
      {
        title: "Module 4: Endpoint Monitoring and Response",
        topics: ["Process and log monitoring", "Investigating suspicious behaviour", "Containment and recovery"],
      },
    ],
  },
  "network-defense": {
    emoji: "🛰️",
    pace: "Self-paced with instructor support",
    price: "Free",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco Networking Academy Network Defense",
      description:
        "Delivered through the Cisco Networking Academy, building the blue-team monitoring skills that complement CyberOps Associate and Endpoint Security.",
      badges: ["SIEM & NetFlow Labs", "Blue-Team Focused", "Self-Paced Online"],
    },
    overview:
      "Network Defense gives you the skills to monitor, protect, and investigate enterprise networks. You'll learn how attackers move across networks, how SOC analysts use logs and SIEM tools to detect intrusion attempts, and how to triage and escalate alerts. The course pairs theory with hands-on labs covering packet analysis, intrusion-detection, and response workflows.",
    learnings: [
      "Describe network attack methods and defender countermeasures",
      "Use logs, NetFlow, and SIEM data to detect malicious activity",
      "Evaluate and prioritise security alerts",
      "Apply intrusion detection and prevention concepts",
      "Document findings and recommend remediation",
    ],
    prerequisites: [
      "Cybersecurity Essentials or equivalent recommended",
      "TCP/IP and networking fundamentals",
      "Comfort with the Linux command line",
    ],
    certification: "Certificate of Completion in Network Defense (Cisco Networking Academy)",
    curriculum: [
      {
        title: "Module 1: Understanding Defense",
        topics: ["Defence-in-depth", "Security operations centre roles", "Common threat actors"],
      },
      {
        title: "Module 2: System and Network Defense",
        topics: ["Network access control", "Firewalls, IDS, and IPS", "Segmentation"],
      },
      {
        title: "Module 3: Access Control",
        topics: ["AAA fundamentals", "Identity and authentication services", "Authorisation models"],
      },
      {
        title: "Module 4: Defending the Network",
        topics: ["Cryptography in transit", "Endpoint protection", "Wireless and mobile defence"],
      },
      {
        title: "Module 5: Network Security Testing",
        topics: ["Security assessment", "Penetration testing concepts", "Reporting and remediation"],
      },
    ],
  },
  "network-security": {
    emoji: "🌐",
    pace: "Instructor-led (Weekday evenings or Weekend classes)",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco Networking Academy Network Security",
      description:
        "Delivered through the Cisco Networking Academy with hands-on Cisco lab equipment and Packet Tracer simulations. Builds the practical skills required to design and operate secure enterprise networks.",
      badges: ["Cisco Hands-On Labs", "Firewall, VPN & IPS Skills", "CCNP Security Aligned Topics"],
    },
    overview:
      "Network Security is an in-depth course covering the design, configuration, and operation of secure enterprise networks. Topics include securing routers and switches, deploying firewalls and IPS, building VPNs, implementing AAA, and protecting against modern attacks. Hands-on labs use Cisco devices and Packet Tracer to apply concepts in realistic enterprise scenarios.",
    learnings: [
      "Secure routers, switches, and management plane access",
      "Configure ACLs, firewalls, and zone-based policy",
      "Deploy site-to-site and remote-access VPNs",
      "Implement AAA with TACACS+ and RADIUS",
      "Apply IPS/IDS, content security, and endpoint integration",
      "Plan and document network security architectures",
    ],
    prerequisites: [
      "CCNA-level knowledge of routing and switching",
      "Cybersecurity Essentials or equivalent recommended",
      "Experience with Cisco IOS command line",
    ],
    certification:
      "Certificate of Completion in Network Security (Cisco Networking Academy) — preparation for CCNP Security technologies.",
    curriculum: [
      {
        title: "Module 1: Securing Networks",
        topics: ["Modern threats and attack types", "Security policies and frameworks", "Network security architecture"],
      },
      {
        title: "Module 2: Secure Network Devices",
        topics: ["Securing routers and switches", "Securing the management plane", "Layer 2 security features"],
      },
      {
        title: "Module 3: Access Control and AAA",
        topics: ["AAA on Cisco devices", "TACACS+ and RADIUS", "Zone-based policy firewall"],
      },
      {
        title: "Module 4: Firewalls and VPNs",
        topics: ["Stateful firewalls", "IPsec and SSL VPNs", "Site-to-site and remote-access designs"],
      },
      {
        title: "Module 5: IPS, Endpoint & Content Security",
        topics: ["Intrusion prevention", "Endpoint security integration", "Email and web security"],
      },
      {
        title: "Module 6: Cryptography and PKI",
        topics: ["Cryptographic services", "Digital certificates", "PKI deployment"],
      },
    ],
  },
  "cyber-threat-management": {
    emoji: "🧭",
    pace: "Self-paced with instructor support",
    price: "Free",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco Networking Academy Cyber Threat Management",
      description:
        "Delivered through the Cisco Networking Academy as part of the cybersecurity learning pathway. Bridges technical defence with governance, risk, and incident management skills.",
      badges: ["NIST & ISO Aligned", "Incident Response Focus", "Self-Paced Online"],
    },
    overview:
      "Cyber Threat Management focuses on the governance, risk, and operations work that keeps modern security programs running. You'll learn how organisations identify, assess, and manage cyber risk, plan incident response, conduct digital forensics, and build security policies and playbooks aligned to industry frameworks such as NIST and ISO 27001.",
    learnings: [
      "Apply governance, risk, and compliance concepts",
      "Build and operate an incident response program",
      "Plan and conduct vulnerability assessments",
      "Use digital forensics processes to investigate incidents",
      "Develop policies, playbooks, and reporting aligned to NIST/ISO",
    ],
    prerequisites: [
      "Cybersecurity Essentials or Introduction to Cybersecurity",
      "Basic understanding of IT operations",
      "Interest in security management and risk",
    ],
    certification: "Certificate of Completion in Cyber Threat Management (Cisco Networking Academy)",
    curriculum: [
      {
        title: "Module 1: Governance and Compliance",
        topics: ["Cybersecurity governance", "Regulations and frameworks", "Policies, standards, and procedures"],
      },
      {
        title: "Module 2: Network Security Testing",
        topics: ["Vulnerability assessment", "Penetration testing concepts", "Reporting findings"],
      },
      {
        title: "Module 3: Threat Intelligence",
        topics: ["Intelligence sources", "Sharing and consuming threat data", "Indicators of compromise"],
      },
      {
        title: "Module 4: Endpoint Vulnerability Assessment",
        topics: ["Asset and patch management", "Risk-based prioritisation", "Remediation planning"],
      },
      {
        title: "Module 5: Risk Management and Security Controls",
        topics: ["Risk frameworks", "Control selection", "Continuous monitoring"],
      },
      {
        title: "Module 6: Digital Forensics and Incident Analysis & Response",
        topics: ["Forensics process and tools", "Chain of custody", "Incident response lifecycle"],
      },
    ],
  },
  "industrial-cybersecurity-essentials": {
    emoji: "🏭",
    pace: "Self-paced with instructor support",
    price: "Free",
    includes: [
      "Expert instruction",
      "Hands-on labs",
      "Course materials",
      "Certificate of completion",
    ],
    careerPath: {
      title: "Cisco Networking Academy Industrial Cybersecurity",
      description:
        "Delivered through the Cisco Networking Academy with hands-on Packet Tracer and Kali Linux labs that simulate industrial environments safely.",
      badges: ["ICS & OT Focused", "Packet Tracer + Kali Labs", "Self-Paced Online"],
    },
    overview:
      "Industrial Control Systems (ICS) and Operational Technology (OT) keep factories, utilities, and critical infrastructure running — and they are increasingly targeted. This course teaches the essentials of industrial cybersecurity: how IT and OT differ, common ICS protocols, threats unique to industrial environments, and defence strategies. You'll practise safely in Cisco Packet Tracer and Kali Linux virtual machines.",
    learnings: [
      "Explain ICS, SCADA, and OT environments",
      "Compare IT and OT security requirements",
      "Identify common ICS protocols and their weaknesses",
      "Apply network segmentation and the Purdue model",
      "Use defensive controls suited to industrial environments",
    ],
    prerequisites: [
      "Cybersecurity Essentials or equivalent",
      "Basic networking knowledge",
      "Familiarity with Linux command line",
    ],
    certification:
      "Certificate of Completion in Industrial Cybersecurity Essentials (Cisco Networking Academy)",
    curriculum: [
      {
        title: "Module 1: Industrial Systems and Cybersecurity",
        topics: ["ICS, SCADA, and OT overview", "Critical infrastructure context", "IT vs OT security"],
      },
      {
        title: "Module 2: Industrial Network Architectures",
        topics: ["The Purdue model", "Common ICS protocols", "Network segmentation strategies"],
      },
      {
        title: "Module 3: Threats to Industrial Systems",
        topics: ["ICS-specific attacks", "Notable incidents", "Risk modelling for OT"],
      },
      {
        title: "Module 4: Defending Industrial Systems",
        topics: ["Hardening industrial devices", "Monitoring and detection", "Incident response in OT"],
      },
    ],
  },
};
