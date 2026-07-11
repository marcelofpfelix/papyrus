import { demoPaperConfig } from "./demo-nav";

export const demoSite = {
  homePostCount: 3,
  homeProjectCount: 3,
  postListLimit: demoPaperConfig.postCard.limit ?? 20,
  post_card: {
    tags: demoPaperConfig.postCard.tags,
    read_time: demoPaperConfig.postCard.readTime,
    fresh_indicators: demoPaperConfig.postCard.freshIndicators,
    fresh_indicator_text: demoPaperConfig.postCard.freshIndicatorText,
    updated_date_only: demoPaperConfig.postCard.updatedDateOnly,
  },
};
