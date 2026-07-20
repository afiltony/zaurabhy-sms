export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  /** Cover photo shown on the listing card and post header. */
  coverImage: string | null;
  /** ISO date, e.g. "2026-07-20". */
  date: string;
  /** One entry per paragraph. */
  content: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "crimson-harvest-rakthashali-rice",
    title: "The Crimson Harvest: My 4-Month Journey with Rakthashali Rice",
    excerpt:
      "A four-month, chemical-free journey growing Rakthashali (Red Rice) in Kerala — from sowing organic seeds to a bowl of crimson rice kanji with spicy fish and coconut chammanthi.",
    coverImage: null,
    date: "2026-07-20",
    content: [
      "In a world of fast food and processed grains, there is a profound satisfaction in returning to the soil. For the past four months, I decided to step away from the digital screen and into the paddy field to grow a grain that is as much medicine as it is food: Rakthashali (Red Rice).",
      "Known historically for its health benefits—particularly its low glycemic index and high antioxidant content—this rare variety is a treasure of Kerala's agricultural heritage. Here is the story of how a handful of seeds became a nourishing meal.",
      "Step 1: Sowing the Seeds of Health",
      "The journey began with selecting high-quality, organic Rakthashali seeds. Unlike commercial farming, I focused on organic preparation. The field was readied with natural compost and cow dung, ensuring the soil was rich and chemical-free. Watching the first green shoots break through the mud felt like witnessing a small miracle.",
      "Step 2: The Four-Month Vigil",
      "Rakthashali is a hardy but delicate variety. Over the next 120 days, the process was one of patience:",
      "Water Management: Maintaining the right level of water in the patches.",
      "Natural Protection: Using traditional methods like neem-based sprays to keep pests at bay.",
      "The Transformation: By the third month, the field transformed from a vibrant green to a deep, rustic gold with hints of crimson.",
      "Step 3: Reaping the Rewards",
      "Harvesting is back-breaking work, but there is a rhythmic beauty to it. We reaped the stalks manually, tied them into sheaves, and let them dry under the Kerala sun. The sound of the grain being threshed—the \"clack-clack\" against the wooden planks—marked the end of the labor and the beginning of the feast.",
      "Step 4: From Field to Table",
      "After milling, the result was a beautiful, deep-red grain, unpolished and full of life.",
      "There is no better way to celebrate this harvest than with a bowl of Rakthashali Kanji (Rice Soup). The starch is thick and creamy, carrying an earthy aroma that store-bought rice simply cannot replicate.",
      "The Final Reward",
      "Imagine a steaming cup of this crimson rice soup, paired with a piece of pan-seared spicy fish and a side of crushed coconut sauce (Thenga Chammanthi) spiked with bird's eye chilies and shallots. The heat of the sauce perfectly complements the mild, nutty sweetness of the rice.",
      "A Note on Zaurabhya Rakthashali: This project was born out of a desire for healthy eating and personal well-being. While I am passionate about preserving these traditional grains, this specific batch of Zaurabhya Rakthashali rice is grown for home use and is not for sale.",
      "Growing your own food changes your relationship with what you eat. On this day dedicated to healthy living, I can truly say that the best medicine is grown in the earth, nurtured by hand, and shared with family.",
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
