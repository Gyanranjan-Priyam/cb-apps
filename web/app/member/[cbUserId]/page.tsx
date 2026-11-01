import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import MemberPublicProfile from "./_components/member-public-profile";
import { getUserProfileImageUrl } from "@/lib/image-utils";

interface PageProps {
  params: Promise<{ cbUserId: string }>;
}


async function getMemberByCbUserId(cbUserId: string) {
  // Decode the URL parameter
  const decodedId = decodeURIComponent(cbUserId);

  // Try exact match on cbUserId first
  let member = await prisma.user.findFirst({
    where: {
      cbUserId: { equals: decodedId, mode: "insensitive" },
    },
    select: {
      id: true,
      cbUserId: true,
      name: true,
      email: true,
      username: true,
      firstName: true,
      middleName: true,
      lastName: true,
      profileImageKey: true,
      image: true,
      registration: true,
      rollNumber: true,
      branch: true,
      admissionYear: true,
      mobileNumber: true,
      whatsappNumber: true,
      collegeName: true,
      collegeAddress: true,
      state: true,
      district: true,
      address: true,
      postOffice: true,
      policeStation: true,
      block: true,
      pinCode: true,
      githubUsername: true,
      specializedDomain: true,
      socialLinks: true,
      customLinks: true,
      profileComplete: true,
      batch: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      createdAt: true,
      role: true,
      banned: true,
    },
  });

  if (!member) {
    // Fallback: try matching by username or id
    member = await prisma.user.findFirst({
      where: {
        OR: [
          { id: decodedId },
          { username: { equals: decodedId, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        cbUserId: true,
        name: true,
        email: true,
        username: true,
        firstName: true,
        middleName: true,
        lastName: true,
        profileImageKey: true,
        image: true,
        registration: true,
        rollNumber: true,
        branch: true,
        admissionYear: true,
        mobileNumber: true,
        whatsappNumber: true,
        collegeName: true,
        collegeAddress: true,
        state: true,
        district: true,
        address: true,
        postOffice: true,
        policeStation: true,
        block: true,
        pinCode: true,
        githubUsername: true,
        specializedDomain: true,
        socialLinks: true,
        customLinks: true,
        profileComplete: true,
        batch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        role: true,
        banned: true,
      },
    });
  }

  return member;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cbUserId } = await params;
  const member = await getMemberByCbUserId(cbUserId);

  if (!member) {
    return {
      title: "Member Not Found | CodeBreakers GCEK",
      description: "The requested CodeBreakers member profile could not be found.",
    };
  }

  // Resolve member's profile image (S3 custom upload first, OAuth/Google avatar fallback)
  const userImage = getUserProfileImageUrl({
    profileImageKey: member.profileImageKey,
    image: member.image,
  });

  const memberIdentifier = member.cbUserId || member.username || member.id;
  const profileUrl = `https://www.codebreakersgcek.tech/member/${encodeURIComponent(memberIdentifier)}`;
  const title = `${member.name} | CodeBreakers GCEK`;
  
  // Format informative description for social link sharing
  const roleText = member.role ? member.role.replace(/,/g, " •") : "Member";
  const academicDetails = [
    member.branch,
    member.admissionYear ? `Class of ${member.admissionYear}` : null,
    member.batch?.name ? `Batch ${member.batch.name}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const description = `${member.name} (@${member.username || member.cbUserId || "member"}) - ${roleText}${
    academicDetails ? ` | ${academicDetails}` : ""
  } at CodeBreakers, Government College of Engineering Kalahandi (GCEK). View public profile, technical domains, GitHub activity, and projects.`;

  // Use user's profile image as OpenGraph preview image (fallback to default CodeBreakers logo)
  const ogImageUrl = userImage || "https://www.codebreakersgcek.tech/assets/logo.png";

  return {
    title,
    description,
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title,
      description,
      url: profileUrl,
      siteName: "CodeBreakers GCEK",
      type: "profile",
      firstName: member.firstName || member.name.split(" ")[0],
      lastName: member.lastName || member.name.split(" ").slice(1).join(" "),
      username: member.username || member.cbUserId || undefined,
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 800,
          alt: `${member.name} - CodeBreakers GCEK Profile`,
        },
      ],
    },
    twitter: {
      card: userImage ? "summary" : "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: "@codebreakers_gcek",
    },
  };
}


export default async function MemberPublicProfilePage({ params }: PageProps) {
  const { cbUserId } = await params;
  const member = await getMemberByCbUserId(cbUserId);

  if (!member || member.banned) {
    notFound();
  }

  return <MemberPublicProfile member={member} />;
}
