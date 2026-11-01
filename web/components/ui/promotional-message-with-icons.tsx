"use client";

import React from 'react';
import { 
  FaFire, 
  FaCog, 
  FaMoneyBillAlt, 
  FaStar, 
  FaFlagCheckered, 
  FaFistRaised, 
  FaFutbol, 
  FaMapMarkerAlt, 
  FaLaptop, 
  FaGift, 
  FaArrowRight, 
  FaCalendarAlt, 
  FaLink, 
  FaInstagram 
} from 'react-icons/fa';

interface PromotionalMessageProps {
  eventUrl: string;
  className?: string;
}

// React Icon components for UI display
export const PromotionalIcons = {
  fire: FaFire,
  gear: FaCog,
  money: FaMoneyBillAlt,
  star: FaStar,
  racing: FaFlagCheckered,
  fight: FaFistRaised,
  soccer: FaFutbol,
  location: FaMapMarkerAlt,
  laptop: FaLaptop,
  party: FaGift,
  arrow: FaArrowRight,
  calendar: FaCalendarAlt,
  link: FaLink,
  camera: FaInstagram
};

// React component for promotional message with icons
export const PromotionalMessageWithIcons: React.FC<PromotionalMessageProps> = ({ 
  eventUrl, 
  className = "" 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-lg font-bold text-red-500">
        <PromotionalIcons.fire className="text-red-500" />
        <span>CodeBreakers 2025 – The Ultimate Robotics & Tech Challenge!</span>
        <PromotionalIcons.fire className="text-red-500" />
      </div>
      
      <div className="flex items-start gap-2">
        <PromotionalIcons.gear className="text-blue-500 mt-1 flex-shrink-0" />
        <span>
          Gear up for GCEK Bhawanipatna's premier techfest! Build, program, and compete with your bots, 
          or showcase your coding skills in a 14-hour hackathon, all for a total prize pool of ₹93,000
        </span>
        <PromotionalIcons.money className="text-green-500 mt-1 flex-shrink-0" />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 font-semibold">
          <PromotionalIcons.star className="text-yellow-500" />
          <span>Competitions Include:</span>
        </div>
        
        <div className="space-y-2 ml-4">
          <div className="flex items-start gap-2">
            <PromotionalIcons.racing className="text-red-600 mt-1 flex-shrink-0" />
            <span><strong>Death Race</strong> – Push your robot's speed and agility to the limit on a challenging track!</span>
          </div>
          <div className="flex items-start gap-2">
            <PromotionalIcons.fight className="text-orange-600 mt-1 flex-shrink-0" />
            <span><strong>Robo Sumo</strong> – Step into the ring and outlast your opponents without leaving the circle!</span>
          </div>
          <div className="flex items-start gap-2">
            <PromotionalIcons.soccer className="text-green-600 mt-1 flex-shrink-0" />
            <span><strong>Robo Soccer</strong> – Team up and score with precision, strategy, and speed!</span>
          </div>
          <div className="flex items-start gap-2">
            <PromotionalIcons.location className="text-blue-600 mt-1 flex-shrink-0" />
            <span><strong>Line Follower</strong> – Test accuracy and control as your bot follows tricky paths to the finish.</span>
          </div>
          <div className="flex items-start gap-2">
            <PromotionalIcons.laptop className="text-purple-600 mt-1 flex-shrink-0" />
            <span><strong>Hackathon (14 Hours)</strong> – Solve real-world problems with software, IoT, or simulation-based projects.</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-300">
          <PromotionalIcons.party className="text-green-600" />
          <span>Early Bird Registration – Limited Spots Available!</span>
        </div>
        <div className="flex items-center gap-2">
          <PromotionalIcons.arrow className="text-green-600" />
          <span>Register now and secure your chance to compete!</span>
        </div>
      </div>

      <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <PromotionalIcons.calendar className="text-blue-600 flex-shrink-0" />
          <span><strong>Dates:</strong> 17th -18th October 2025</span>
        </div>
        <div className="flex items-center gap-2">
          <PromotionalIcons.location className="text-blue-600 flex-shrink-0" />
          <span><strong>Venue:</strong> Government College of Engineering, Kalahandi, Bhawanipatna</span>
        </div>
      </div>

      <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 break-all">
          <PromotionalIcons.link className="text-gray-600 flex-shrink-0" />
          <span><strong>Event Page:</strong> <a href={eventUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{eventUrl}</a></span>
        </div>
        <div className="flex items-center gap-2">
          <PromotionalIcons.link className="text-gray-600 flex-shrink-0" />
          <span><strong>Visit:</strong> <a href="https://CodeBreakers.netlify.app/events" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://CodeBreakers.netlify.app/events</a></span>
        </div>
        <div className="flex items-center gap-2">
          <PromotionalIcons.link className="text-gray-600 flex-shrink-0" />
          <span><strong>Registration:</strong> <a href="https://www.codebreakersgcek.tech" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://www.codebreakersgcek.tech</a></span>
        </div>
        <div className="flex items-center gap-2">
          <PromotionalIcons.camera className="text-pink-600 flex-shrink-0" />
          <span><strong>Instagram:</strong> <a href="https://www.instagram.com/codebreakersgcek" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">@codebreakersgcek</a></span>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <div className="mb-2">
          <strong>Rulebook:</strong> <a href="https://drive.google.com/drive/folders/1sFeMzhfXp_6N6Ghe96mhLu4LC1sOYfBm?usp=sharing" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Competition Rules & Guidelines</a>
        </div>
        <div>
          <strong>For queries contact:</strong>
          <div className="ml-4 space-y-1 mt-1">
            <div><a href="tel:+918480112440" className="text-blue-600 hover:underline">+91 8480112440</a></div>
            <div><a href="tel:+919905239937" className="text-blue-600 hover:underline">+91 9905239937</a></div>
            <div><a href="tel:+919556192291" className="text-blue-600 hover:underline">+91 95561 92291</a></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual icon components for flexible usage
export const IconComponents = {
  Fire: ({ className = "" }: { className?: string }) => <FaFire className={className} />,
  Gear: ({ className = "" }: { className?: string }) => <FaCog className={className} />,
  Money: ({ className = "" }: { className?: string }) => <FaMoneyBillAlt className={className} />,
  Star: ({ className = "" }: { className?: string }) => <FaStar className={className} />,
  Racing: ({ className = "" }: { className?: string }) => <FaFlagCheckered className={className} />,
  Fight: ({ className = "" }: { className?: string }) => <FaFistRaised className={className} />,
  Soccer: ({ className = "" }: { className?: string }) => <FaFutbol className={className} />,
  Location: ({ className = "" }: { className?: string }) => <FaMapMarkerAlt className={className} />,
  Laptop: ({ className = "" }: { className?: string }) => <FaLaptop className={className} />,
  Party: ({ className = "" }: { className?: string }) => <FaGift className={className} />,
  Arrow: ({ className = "" }: { className?: string }) => <FaArrowRight className={className} />,
  Calendar: ({ className = "" }: { className?: string }) => <FaCalendarAlt className={className} />,
  Link: ({ className = "" }: { className?: string }) => <FaLink className={className} />,
  Camera: ({ className = "" }: { className?: string }) => <FaInstagram className={className} />
};