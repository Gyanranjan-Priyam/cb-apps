// CodeBreakers 2025 promotional message template
// This file contains the standardized promotional content for all social sharing platforms
// Update this file to modify the message across all sharing methods

// React Icon component names for UI components to import and use
export const REACT_ICONS_MAP = {
  fire: "FaFire",
  gear: "FaCog", 
  money: "FaMoneyBillAlt",
  star: "FaStar",
  racing: "FaFlagCheckered",
  fight: "FaFistRaised", 
  soccer: "FaFutbol",
  location: "FaMapMarkerAlt",
  laptop: "FaLaptop",
  party: "FaGift",
  arrow: "FaArrowRight",
  calendar: "FaCalendarAlt",
  link: "FaLink",
  camera: "FaInstagram"
};

// For React components with icons, import from:
// import { PromotionalMessageWithIcons, IconComponents } from "@/components/ui/promotional-message-with-icons";

export const createPromotionalMessage = (eventUrl: string): string => {
  return `🔥 CodeBreakers 2025 – The Ultimate Robotics & Tech Challenge! 🔥
⚙ Gear up for GCEK Bhawanipatna's premier techfest! Build, program, and compete with your bots, or showcase your coding skills in a 14-hour hackathon, all for a total prize pool of ₹93,000 💰

✨ Competitions Include:
🏁 Death Race – Push your robot's speed and agility to the limit on a challenging track!
🥊 Robo Sumo – Step into the ring and outlast your opponents without leaving the circle!
⚽ Robo Soccer – Team up and score with precision, strategy, and speed!
📍 Line Follower – Test accuracy and control as your bot follows tricky paths to the finish.
💻 Hackathon (14 Hours) – Solve real-world problems with software, IoT, or simulation-based projects.

🎉 Early Bird Registration – Limited Spots Available!
👉 Register now and secure your chance to compete!

📅 Dates: 17th -18th October 2025
📍 Venue: Government College of Engineering, Kalahandi, Bhawanipatna

🔗 Event Page: ${eventUrl}

🔗 Visit here: https://www.codebreakersgcek.tech
🔗 For Registration Visit: https://www.codebreakersgcek.tech
📸 Instagram: https://www.instagram.com/codebreakersgcek

Rulebook: https://drive.google.com/drive/folders/1sFeMzhfXp_6N6Ghe96mhLu4LC1sOYfBm?usp=sharing
For queries contact:
+91 8480112440
+91 9905239937
+91 95561 92291`;
};

// Email-specific message with additional closing
export const createEmailMessage = (eventUrl: string): string => {
  return `${createPromotionalMessage(eventUrl)}

Best regards`;
};

// Subject line for email sharing
export const EMAIL_SUBJECT = "🔥 CodeBreakers 2025 – The Ultimate Robotics & Tech Challenge! 🔥";

// Configuration object for easy updates
export const CodeBreakers_CONFIG = {
  eventName: "CodeBreakers 2025",
  tagline: "The Ultimate Robotics & Tech Challenge!",
  institution: "GCEK Bhawanipatna",
  prizePool: "₹93,000",
  dates: "17th -18th October 2025",
  venue: "Government College of Engineering, Kalahandi, Bhawanipatna",
  mainWebsite: "https://CodeBreakers.netlify.app/events",
  registrationSite: "https://registration-CodeBreakers.vercel.app",
  instagram: "https://www.instagram.com/gcek.CodeBreakers?igsh=MWdlMXFsdXh1OHZ6Mg==",
  rulebook: "https://drive.google.com/drive/folders/1sFeMzhfXp_6N6Ghe96mhLu4LC1sOYfBm?usp=sharing",
  contactNumbers: [
    "+91 8480112440",
    "+91 9905239937", 
    "+91 95561 92291"
  ],
  competitions: [
    {
      name: "Death Race",
      description: "Push your robot's speed and agility to the limit on a challenging track!",
      emoji: "🏁",
      reactIcon: "FaFlagCheckered"
    },
    {
      name: "Robo Sumo",
      description: "Step into the ring and outlast your opponents without leaving the circle!",
      emoji: "🥊",
      reactIcon: "FaFistRaised"
    },
    {
      name: "Robo Soccer",
      description: "Team up and score with precision, strategy, and speed!",
      emoji: "⚽",
      reactIcon: "FaFutbol"
    },
    {
      name: "Line Follower",
      description: "Test accuracy and control as your bot follows tricky paths to the finish.",
      emoji: "📍",
      reactIcon: "FaMapMarkerAlt"
    },
    {
      name: "Hackathon (14 Hours)",
      description: "Solve real-world problems with software, IoT, or simulation-based projects.",
      emoji: "💻",
      reactIcon: "FaLaptop"
    }
  ]
};