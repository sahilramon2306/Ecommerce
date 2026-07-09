import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { askShoppingAssistant } from "../api/aiApi";
import "../styles/ai-shopping-assistant.css";

const suggestedPrompts = [
  "Suggest products under 1000",
  "Best rated products",
  "Show me wallets",
  "Budget gifts"
];

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi, I can help you find products by budget, category, brand, or rating.",
  products: []
};

const createMessageId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getInitials = (value = "") => {
  const words = String(value).trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "AI";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const formatPrice = (product) => {
  const value = product.salePrice || product.price || 0;
  const price = Number(value);

  if (!Number.isFinite(price) || price <= 0) {
    return "Price unavailable";
  }

  return `Rs. ${price.toLocaleString("en-IN")}`;
};

const getProductImage = (product) => {
  const image = product.images?.[0];

  if (!image || typeof image !== "string") {
    return "";
  }

  return image;
};

const AiShoppingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([welcomeMessage]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const hasUserMessages = useMemo(
    () => messages.some((item) => item.role === "user"),
    [messages]
  );

  useEffect(() => {
    if (!isOpen) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [isOpen, messages, loading]);

  const handleAsk = async (promptText = message) => {
    const question = String(promptText || "").trim();

    if (!question || loading) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId("user"),
        role: "user",
        text: question,
        products: []
      }
    ]);

    setMessage("");
    setLoading(true);

    try {
      const res = await askShoppingAssistant(question);
      const products = Array.isArray(res.data?.products)
        ? res.data.products
        : [];

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          text:
            res.data?.success && res.data?.reply
              ? res.data.reply
              : "I could not find a helpful answer right now.",
          products
        }
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId("assistant-error"),
          role: "assistant",
          text: "Sorry, AI assistant is not available right now.",
          products: [],
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (loading) return;

    setMessages([welcomeMessage]);
    setMessage("");
  };

  const handleImageError = (event) => {
    const image = event.currentTarget;
    const fallback = image.nextElementSibling;

    image.hidden = true;

    if (fallback) {
      fallback.hidden = false;
    }
  };

  return (
    <div className="ai-assistant">
      {isOpen && (
        <div className="ai-assistant-panel">
          <div className="ai-assistant-header">
            <div>
              <span className="ai-assistant-kicker">SahimonCart AI</span>
              <h3>Shopping Assistant</h3>
              <p>Find products by budget, brand, or use case</p>
            </div>

            <div className="ai-header-actions">
              <button
                type="button"
                className="ai-clear-btn"
                onClick={clearChat}
                disabled={loading}
              >
                Clear
              </button>

              <button
                type="button"
                className="ai-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI assistant"
              >
                x
              </button>
            </div>
          </div>

          <div className="ai-assistant-body">
            <div className="ai-message-list">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`ai-message ai-message--${item.role} ${
                    item.isError ? "ai-message--error" : ""
                  }`}
                >
                  <div className="ai-message-bubble">{item.text}</div>

                  {item.products?.length > 0 && (
                    <div className="ai-products">
                      {item.products.map((product) => (
                        <Link
                          key={product._id}
                          to={`/product/${product._id}`}
                          className="ai-product-card"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="ai-product-thumb">
                            {getProductImage(product) ? (
                              <img
                                src={getProductImage(product)}
                                alt={product.name}
                                onError={handleImageError}
                              />
                            ) : null}

                            <span hidden={Boolean(getProductImage(product))}>
                              {getInitials(product.name)}
                            </span>
                          </div>

                          <div className="ai-product-info">
                            <h4>{product.name}</h4>
                            <p>{formatPrice(product)}</p>

                            {Number(product.rating) > 0 && (
                              <span>{product.rating} rating</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="ai-message ai-message--assistant">
                  <div className="ai-message-bubble ai-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              {!hasUserMessages && (
                <div className="ai-suggestions">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleAsk(prompt)}
                      disabled={loading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          <form
            className="ai-assistant-footer"
            onSubmit={(event) => {
              event.preventDefault();
              handleAsk();
            }}
          >
            <input
              type="text"
              placeholder="Ask for product suggestions..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={loading}
            />

            <button type="submit" disabled={loading || !message.trim()}>
              {loading ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="ai-assistant-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI shopping assistant"
      >
        Chat
      </button>
    </div>
  );
};

export default AiShoppingAssistant;