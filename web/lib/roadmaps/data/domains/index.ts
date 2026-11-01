/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RoadmapData } from "../../types";
import { getAutoLayoutedElements } from "../../layout";

import { webDevelopmentRoadmap } from "./web-development";
import { frontendDevelopmentRoadmap } from "./frontend-development";
import { backendDevelopmentRoadmap } from "./backend-development";
import { fullStackDevelopmentRoadmap } from "./full-stack-development";
import { aiMachineLearningRoadmap } from "./ai-machine-learning";
import { dataScienceAnalyticsRoadmap } from "./data-science-analytics";
import { cloudComputingDevOpsRoadmap } from "./cloud-computing-devops";
import { cybersecurityRoadmap } from "./cybersecurity";
import { mobileAppDevelopmentRoadmap } from "./mobile-app-development";
import { competitiveProgrammingRoadmap } from "./competitive-programming";
import { blockchainWeb3Roadmap } from "./blockchain-web3";
import { uiUxDesignRoadmap } from "./ui-ux-design";
import { embeddedSystemsIotRoadmap } from "./embedded-systems-iot";
import { gameDevelopmentRoadmap } from "./game-development";
import { roboticsAutomationRoadmap } from "./robotics-automation";

const RAW_DOMAINS: RoadmapData[] = [
  webDevelopmentRoadmap,
  frontendDevelopmentRoadmap,
  backendDevelopmentRoadmap,
  fullStackDevelopmentRoadmap,
  aiMachineLearningRoadmap,
  dataScienceAnalyticsRoadmap,
  cloudComputingDevOpsRoadmap,
  cybersecurityRoadmap,
  mobileAppDevelopmentRoadmap,
  competitiveProgrammingRoadmap,
  blockchainWeb3Roadmap,
  uiUxDesignRoadmap,
  embeddedSystemsIotRoadmap,
  gameDevelopmentRoadmap,
  roboticsAutomationRoadmap,
];

// Apply automatic spine & balanced wing layout calculation to all 15 domains
export const ALL_ROADMAPS: RoadmapData[] = RAW_DOMAINS.map((rm) => {
  const { nodes: layoutedNodes, edges: layoutedEdges } = getAutoLayoutedElements(
    rm.nodes as any,
    rm.edges as any,
    "TB"
  );
  return {
    ...rm,
    nodes: layoutedNodes as any,
    edges: layoutedEdges as any,
  };
});
