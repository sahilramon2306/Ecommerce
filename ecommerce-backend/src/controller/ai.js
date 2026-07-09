const axios = require("axios");
const productModel = require("../model/product");

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeText = (value = "") => {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ");
};

const isInvalidOrMeaninglessMessage = (message) => {
  const text = normalizeText(message);

  if (!text) return true;
  if (text.length <= 1) return true;
  if (/^\d+$/.test(text)) return true;
  if (/^[^a-z0-9]+$/i.test(text)) return true;
  if (/^(.)\1{2,}$/.test(text.replace(/\s/g, ""))) return true;

  const words = text.split(/\s+/).filter(Boolean);

  const meaningfulWords = words.filter((word) => {
    return (
      word.length >= 2 &&
      /[a-z]/i.test(word) &&
      !/^(.)\1{2,}$/.test(word)
    );
  });

  if (meaningfulWords.length === 0) return true;

  const keyboardMashPattern =
    /^(asdf|qwer|zxcv|hjkl|jkl|dfgh|sdf|wer|ert|cvb|bnm|lkj|poi|uyt)+$/i;

  if (words.some((word) => keyboardMashPattern.test(word))) return true;

  return false;
};

const isGreetingMessage = (message) => {
  return /^(hi|hello|hey|hii|hiii|namaste|salam|good morning|good afternoon|good evening)$/.test(
    normalizeText(message)
  );
};

const isThanksMessage = (message) => {
  return /^(thanks|thank you|thankyou|ok thanks|okay thanks|great thanks)$/.test(
    normalizeText(message)
  );
};

const isByeMessage = (message) => {
  return /^(bye|goodbye|see you|see ya|talk later)$/.test(
    normalizeText(message)
  );
};

const isHelpMessage = (message) => {
  return /^(help|what can you do|how can you help|options)$/.test(
    normalizeText(message)
  );
};

const getCustomerQueryReply = (message) => {
  const text = normalizeText(message);

  const replies = [
    {
      patterns: [/how are you/, /who are you/],
      reply:
        "I am your SahimonCart shopping assistant. I can help with products, orders, returns, refunds, payments, and account questions."
    },
    {
      patterns: [/track.*order/, /where.*order/, /order.*status/, /delivery status/],
      reply:
        "You can track your order from your account orders page. If needed, contact support with your order ID for faster help."
    },
    {
      patterns: [/return/, /exchange/],
      reply:
        "Returns or exchanges depend on the product policy and delivery date. Please check your order details or contact support."
    },
    {
      patterns: [/refund/, /money back/],
      reply:
        "Refunds are usually processed after return approval or payment verification. You can check refund status from your order details."
    },
    {
      patterns: [/cancel.*order/, /order.*cancel/],
      reply:
        "You can cancel an order before it is shipped. If it has already shipped, you may need to request a return after delivery."
    },
    {
      patterns: [/invoice/, /bill/, /receipt/],
      reply:
        "You can download the invoice from your order details page after the order is placed."
    },
    {
      patterns: [/payment failed/, /failed payment/, /money deducted/, /payment.*deducted/],
      reply:
        "If payment failed but money was deducted, wait for confirmation or refund. You can also contact support with the payment ID."
    },
    {
      patterns: [/payment/, /paid/, /payment method/, /upi/, /card/, /razorpay/],
      reply:
        "Payment options are shown during checkout. If a payment issue occurs, keep your payment ID and contact support."
    },
    {
      patterns: [/cod/, /cash on delivery/],
      reply:
        "Cash on delivery availability depends on your location, selected product, and checkout eligibility."
    },
    {
      patterns: [/shipping/, /delivery/, /deliver/, /how long.*deliver/],
      reply:
        "Delivery time depends on your location and product availability. You can see the latest status from your order page."
    },
    {
      patterns: [/login/, /sign in/, /account/],
      reply:
        "For account help, try logging in again or use the forgot password option from the login page."
    },
    {
      patterns: [/password/, /forgot password/, /reset password/],
      reply:
        "You can reset your password from the forgot password option on the login page."
    },
    {
      patterns: [/contact/, /support/, /customer care/, /complaint/],
      reply:
        "You can contact customer support from the contact page. Share your order ID if your issue is order-related."
    },
    {
      patterns: [/warranty/, /guarantee/],
      reply:
        "Warranty depends on the brand and product. Please check the product description or contact support before purchase."
    },
    {
      patterns: [/size/, /fit/, /measurement/],
      reply:
        "For size and fit, check the product description carefully. If available, use the size chart before ordering."
    },
    {
      patterns: [/coupon/, /discount/, /offer/, /promo/],
      reply:
        "Available offers or discounts are shown on product, cart, or checkout pages when applicable."
    },
    {
      patterns: [/damaged/, /defective/, /wrong item/, /missing item/],
      reply:
        "If your item is damaged, defective, wrong, or missing, contact support with your order ID and product photos."
    },
    {
      patterns: [/address/, /change address/, /shipping address/],
      reply:
        "You can manage saved addresses from your account. For placed orders, address changes may depend on shipment status."
    },
    {
      patterns: [/cart/],
      reply:
        "You can review selected products, quantities, and price details from your cart before checkout."
    },
    {
      patterns: [/wishlist/],
      reply:
        "You can save products to your wishlist and revisit them later from your account."
    },
    {
      patterns: [/joke/, /weather/, /news/, /movie/],
      reply:
        "I am focused on shopping help. Ask me about products, orders, payments, returns, or delivery."
    }
  ];

  const match = replies.find((item) =>
    item.patterns.some((pattern) => pattern.test(text))
  );

  return match?.reply || null;
};

const getPriceRange = (message) => {
  const text = normalizeText(message).replace(/,/g, "");

  const betweenMatch = text.match(
    /between\s*(?:rs\.?|inr|\u20b9)?\s*(\d+)\s*(?:and|to|-)\s*(?:rs\.?|inr|\u20b9)?\s*(\d+)/
  );

  if (betweenMatch) {
    const first = Number(betweenMatch[1]);
    const second = Number(betweenMatch[2]);
    return { min: Math.min(first, second), max: Math.max(first, second) };
  }

  const maxMatch = text.match(
    /(?:under|below|less than|within|up to|upto)\s*(?:rs\.?|inr|\u20b9)?\s*(\d+)/
  );

  if (maxMatch) return { min: null, max: Number(maxMatch[1]) };

  const minMatch = text.match(
    /(?:above|over|more than|greater than)\s*(?:rs\.?|inr|\u20b9)?\s*(\d+)/
  );

  if (minMatch) return { min: Number(minMatch[1]), max: null };

  return { min: null, max: null };
};

const hasPriceIntent = (message) => {
  const range = getPriceRange(message);
  return range.min !== null || range.max !== null;
};

const buildPriceFilter = ({ min, max }) => {
  if (min === null && max === null) return null;

  const effectivePrice = {
    $cond: [
      { $and: [{ $ne: ["$salePrice", null] }, { $gt: ["$salePrice", 0] }] },
      "$salePrice",
      "$price"
    ]
  };

  const expressions = [];

  if (min !== null) expressions.push({ $gte: [effectivePrice, min] });
  if (max !== null) expressions.push({ $lte: [effectivePrice, max] });

  return {
    $expr: expressions.length === 1 ? expressions[0] : { $and: expressions }
  };
};

const getSearchTokens = (message) => {
  const stopWords = new Set([
    "suggest",
    "show",
    "find",
    "give",
    "recommend",
    "search",
    "me",
    "best",
    "good",
    "great",
    "products",
    "product",
    "items",
    "item",
    "under",
    "below",
    "less",
    "than",
    "within",
    "upto",
    "above",
    "over",
    "more",
    "greater",
    "between",
    "and",
    "for",
    "please",
    "budget",
    "cheap",
    "affordable",
    "rated",
    "rating",
    "top",
    "popular",
    "trending",
    "latest",
    "new",
    "buy",
    "purchase",
    "need",
    "want",
    "looking",
    "rs",
    "inr"
  ]);

  return normalizeText(message)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => {
      return (
        word.length >= 3 &&
        !stopWords.has(word) &&
        Number.isNaN(Number(word))
      );
    })
    .slice(0, 5);
};

const hasExplicitShoppingIntent = (message) => {
  return /(buy|purchase|shop|shopping|product|products|item|items|recommend|suggest|show|find|search|need|want|looking for|gift|budget|cheap|affordable|best rated|top rated|popular|trending|latest)/i.test(
    message
  );
};

const isShoppingMessage = (message) => {
  const text = normalizeText(message);

  if (
    isGreetingMessage(text) ||
    isThanksMessage(text) ||
    isByeMessage(text) ||
    isHelpMessage(text) ||
    getCustomerQueryReply(text)
  ) {
    return false;
  }

  if (hasPriceIntent(text) || hasExplicitShoppingIntent(text)) return true;

  return getSearchTokens(text).length > 0 && text.split(/\s+/).length <= 4;
};

const buildSearchFilter = (tokens) => {
  if (!tokens.length) return null;

  return {
    $and: tokens.map((token) => {
      const regex = new RegExp(escapeRegex(token), "i");

      return {
        $or: [
          { name: regex },
          { description: regex },
          { brand: regex }
        ]
      };
    })
  };
};

const getSortOption = (message) => {
  const text = normalizeText(message);

  if (/best rated|top rated|highest rated|rating/.test(text)) {
    return {
      rating: -1,
      ratingCount: -1,
      soldCount: -1
    };
  }

  if (/cheap|lowest|low price|budget|affordable/.test(text)) {
    return {
      salePrice: 1,
      price: 1,
      rating: -1
    };
  }

  if (/popular|trending|best selling|most sold/.test(text)) {
    return {
      soldCount: -1,
      rating: -1
    };
  }

  if (/new|latest|recent/.test(text)) {
    return {
      createdAt: -1
    };
  }

  return {
    soldCount: -1,
    rating: -1,
    createdAt: -1
  };
};

const findProducts = async ({ message, includeSearch }) => {
  const priceFilter = buildPriceFilter(getPriceRange(message));
  const searchFilter = includeSearch
    ? buildSearchFilter(getSearchTokens(message))
    : null;

  const filters = [{ isActive: true }];

  if (priceFilter) filters.push(priceFilter);
  if (searchFilter) filters.push(searchFilter);

  const query = filters.length === 1 ? filters[0] : { $and: filters };

  return productModel
    .find(query)
    .select("name description price salePrice brand stock rating ratingCount soldCount images")
    .sort(getSortOption(message))
    .limit(8);
};

const cleanAiReply = (reply) => {
  return String(reply || "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^\s*[-\u2022]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
};

const askShoppingAssistant = async (req, res) => {
  let products = [];

  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    const cleanMessage = message.trim();

    if (isInvalidOrMeaninglessMessage(cleanMessage)) {
      return res.status(200).json({
        success: true,
        reply:
          "I could not understand that. Please ask about a product, budget, order, delivery, return, payment, or account help.",
        products: []
      });
    }

    const customerReply = getCustomerQueryReply(cleanMessage);

    if (customerReply) {
      return res.status(200).json({
        success: true,
        reply: customerReply,
        products: []
      });
    }

    if (isGreetingMessage(cleanMessage)) {
      return res.status(200).json({
        success: true,
        reply:
          "Hello, I can help you find products by budget, category, brand, or rating.",
        products: []
      });
    }

    if (isThanksMessage(cleanMessage)) {
      return res.status(200).json({
        success: true,
        reply: "You're welcome. Tell me what kind of product you need next.",
        products: []
      });
    }

    if (isByeMessage(cleanMessage)) {
      return res.status(200).json({
        success: true,
        reply: "Goodbye. Come back anytime when you need product help.",
        products: []
      });
    }

    if (isHelpMessage(cleanMessage)) {
      return res.status(200).json({
        success: true,
        reply:
          "You can ask about products, budgets, brands, ratings, orders, returns, refunds, delivery, payments, and invoices.",
        products: []
      });
    }

    if (!isShoppingMessage(cleanMessage)) {
      return res.status(200).json({
        success: true,
        reply:
          "I am here to help with shopping. Ask me for a product, budget, brand, category, order help, or delivery question.",
        products: []
      });
    }

    const allowFallback =
      hasPriceIntent(cleanMessage) || hasExplicitShoppingIntent(cleanMessage);

    products = await findProducts({
      message: cleanMessage,
      includeSearch: true
    });

    if (products.length === 0 && allowFallback) {
      products = await findProducts({
        message: cleanMessage,
        includeSearch: false
      });
    }

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        reply:
          "I could not find matching products right now. Try a different product, budget, brand, or category.",
        products: []
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: true,
        reply: "I found matching products for you.",
        products
      });
    }

    const productContext = products
      .map((product, index) => {
        return `${index + 1}. ${product.name}
Brand: ${product.brand}
Price: ${product.salePrice || product.price}
Stock: ${product.stock}
Rating: ${product.rating}
Description: ${product.description}`;
      })
      .join("\n\n");

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        system_instruction: {
          parts: [
            {
              text:
                "You are SahimonCart's AI shopping assistant. Reply in plain text only. Do not use markdown, bullet points, asterisks, numbering, or bold text. Do not list product names or prices because the website shows product cards separately. Give only one short friendly sentence, maximum 25 words."
            }
          ]
        },
        contents: [
          {
            parts: [
              {
                text: `Customer asked: ${cleanMessage}

Available products:
${productContext}`
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        }
      }
    );

    const reply = cleanAiReply(
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I found some matching products for you."
    );

    return res.status(200).json({
      success: true,
      reply,
      products
    });
  } catch (error) {
    console.error(
      "Gemini Assistant Error:",
      error.response?.data || error.message
    );

    if (error.response) {
      return res.status(200).json({
        success: true,
        reply:
          "I found matching products for you. AI wording is temporarily limited, so showing the best product cards directly.",
        products
      });
    }

    return res.status(500).json({
      success: false,
      message: "AI assistant failed"
    });
  }
};

const cleanJsonText = (text = "") => {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
};

const fallbackProductContent = ({
  name,
  brand,
  price,
  salePrice,
  categoryName,
  features
}) => {
  const sellingPrice = salePrice || price;
  const featureList = String(features || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  const highlights = featureList.length
    ? featureList
    : [
        `Premium ${categoryName || "product"} from ${brand}`,
        "Designed for everyday use",
        "Good value for the price"
      ];

  return {
    description: `${name} by ${brand} is a quality ${
      categoryName || "product"
    } designed for everyday use. It offers reliable performance, practical features, and a premium shopping experience at ${
      sellingPrice ? `Rs. ${sellingPrice}` : "a competitive price"
    }.`,
    shortHighlights: highlights,
    seoTitle: `${name} | ${brand} | SahimonCart`,
    metaDescription: `Buy ${name} by ${brand} at SahimonCart. Explore features, price, offers, and product details online.`
  };
};

const generateProductContent = async (req, res) => {
  try {
    const {
      name,
      brand,
      price,
      salePrice,
      categoryName,
      subCategoryName,
      childCategoryName,
      features
    } = req.body;

    if (!name?.trim() || !brand?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name and brand are required"
      });
    }

    const fallback = fallbackProductContent({
      name,
      brand,
      price,
      salePrice,
      categoryName,
      features
    });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: true,
        source: "fallback",
        data: fallback
      });
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const prompt = `Generate ecommerce product content.

Return ONLY valid JSON in this exact shape:
{
  "description": "80 to 120 words product description",
  "shortHighlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4"],
  "seoTitle": "SEO title under 60 characters",
  "metaDescription": "SEO meta description under 155 characters"
}

Product:
Name: ${name}
Brand: ${brand}
Price: ${price || "Not provided"}
Sale price: ${salePrice || "Not provided"}
Category: ${categoryName || "Not provided"}
Sub category: ${subCategoryName || "Not provided"}
Child category: ${childCategoryName || "Not provided"}
Key features: ${features || "Not provided"}`;

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        }
      }
    );

    const text =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;

    try {
      parsed = JSON.parse(cleanJsonText(text));
    } catch (error) {
      parsed = fallback;
    }

    return res.status(200).json({
      success: true,
      source: "ai",
      data: {
        description: parsed.description || fallback.description,
        shortHighlights: Array.isArray(parsed.shortHighlights)
          ? parsed.shortHighlights.slice(0, 6)
          : fallback.shortHighlights,
        seoTitle: parsed.seoTitle || fallback.seoTitle,
        metaDescription: parsed.metaDescription || fallback.metaDescription
      }
    });
  } catch (error) {
    console.error(
      "Generate Product Content Error:",
      error.response?.data || error.message
    );

    if (error.response) {
      const {
        name,
        brand,
        price,
        salePrice,
        categoryName,
        features
      } = req.body;

      return res.status(200).json({
        success: true,
        source: "fallback",
        data: fallbackProductContent({
          name,
          brand,
          price,
          salePrice,
          categoryName,
          features
        })
      });
    }

    return res.status(500).json({
      success: false,
      message: "AI product content generation failed"
    });
  }
};

module.exports = {
  askShoppingAssistant,
  generateProductContent
};