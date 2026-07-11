import { demoPapyrusConfig } from "./demo-nav";

export const demoSite = {
  homePostCount: 3,
  homeProjectCount: 3,
  postListLimit: demoPapyrusConfig.postCard.limit ?? 20,
  post_card: {
    tags: demoPapyrusConfig.postCard.tags,
    read_time: demoPapyrusConfig.postCard.readTime,
    fresh_indicators: demoPapyrusConfig.postCard.freshIndicators,
    fresh_indicator_text: demoPapyrusConfig.postCard.freshIndicatorText,
    updated_date_only: demoPapyrusConfig.postCard.updatedDateOnly,
  },
};
