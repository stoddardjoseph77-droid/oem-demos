'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import styles from './demo.module.css'

const ENDPOINT = 'https://stoddardjoseph77--claude-orchestrator-demo-chat.modal.run'

function formatCompanyName(slug) {
  if (!slug) return 'Support'
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export default function DemoPage() {
  const params = useParams()
  const slug = params?.slug || 'demo'
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])
  const [productsLoaded, setProductsLoaded] = useState(false)
  const [identifiedProduct, setIdentifiedProduct] = useState(null)
  const [companyName, setCompanyName] = useState('')
  const [hasSentMessage, setHasSentMessage] = useState(false)
  const messagesEndRef = useRef(null)

  // Set initial company name when slug is available
  useEffect(() => {
    if (slug) {
      setCompanyName(formatCompanyName(slug))
    }
  }, [slug])

  // Initialize session
  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem(`demo_session_${slug}`)
      : null
    const id = stored || 'session_' + Math.random().toString(36).substr(2, 9)
    setSessionId(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`demo_session_${slug}`, id)
    }

    // Load cached products
    const cached = typeof window !== 'undefined'
      ? localStorage.getItem(`demo_products_${slug}`)
      : null
    if (cached) {
      try {
        const prods = JSON.parse(cached)
        if (prods && prods.length > 0) {
          setProducts(prods)
          setProductsLoaded(true)
          const randomProduct = prods[Math.floor(Math.random() * prods.length)]
          setInput(`my ${randomProduct} is not functioning properly.`)
        }
      } catch (e) {}
    } else {
      setInput('my product is not functioning properly.')
    }

    // Fetch company info
    loadCompanyInfo()
  }, [slug])

  // No auto-scroll - let the user control their own scroll position

  async function loadCompanyInfo() {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, message: '' })
      })
      const data = await response.json()

      if (data.company_name) {
        setCompanyName(data.company_name)
      }

      if (data.products && data.products.length > 0) {
        setProducts(data.products)
        setProductsLoaded(true)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`demo_products_${slug}`, JSON.stringify(data.products))
        }
        if (!hasSentMessage) {
          const randomProduct = data.products[Math.floor(Math.random() * data.products.length)]
          setInput(`my ${randomProduct} is not functioning properly.`)
        }
      }
    } catch (err) {
      console.error('Failed to load company info:', err)
      setProductsLoaded(true)
    }
  }

  async function sendMessage(e) {
    e?.preventDefault()
    const message = input.trim()
    if (!message || loading || !productsLoaded) return

    setHasSentMessage(true)
    setInput('')
    setLoading(true)
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: message }])

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, message, session_id: sessionId })
      })
      const data = await response.json()

      if (data.error) setError(data.error)
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      }
      if (data.company_name) setCompanyName(data.company_name)
      if (data.products && data.products.length > 0) {
        setProducts(data.products)
        setIdentifiedProduct(data.identified_product)
      }
    } catch (err) {
      setError('Failed to send message. Please try again.')
      console.error(err)
    }

    setLoading(false)
  }

  function resetConversation() {
    const newId = 'session_' + Math.random().toString(36).substr(2, 9)
    setSessionId(newId)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`demo_session_${slug}`, newId)
    }
    setMessages([])
    setIdentifiedProduct(null)
    setHasSentMessage(false)
    setError('')
    if (products.length > 0) {
      const randomProduct = products[Math.floor(Math.random() * products.length)]
      setInput(`my ${randomProduct} is not functioning properly.`)
    } else {
      setInput('my product is not functioning properly.')
    }
  }

  return (
    <div className={styles.body}>
      <div className={styles.mainContainer}>
        {/* Left Side: Chat Demo */}
        <div className={styles.demoSide}>
          <div className={styles.brandHeader}>
            <div className={styles.companyBadge}>
              <span className={styles.icon}>🛠️</span>
              <h1>{companyName}</h1>
            </div>
            <p className={styles.tagline}>AI-Powered Product Support Demo</p>
          </div>

          <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
              <div className={styles.avatar}>🤖</div>
              <div className={styles.info}>
                <h2>{companyName} Support</h2>
                <p><span className={styles.statusDot}></span> Online &amp; Ready to Help</p>
              </div>
              <button className={styles.resetBtn} onClick={resetConversation} title="Start a new conversation">
                🔄 New Chat
              </button>
            </div>

            <div className={styles.productsList}>
              <span className={styles.label}>Supported products</span>
              <div className={styles.pillsContainer}>
                {products.length === 0 ? (
                  <span className={styles.productPill} style={{ opacity: 0.5 }}>Loading...</span>
                ) : (
                  products.map((p, i) => (
                    <span key={i} className={`${styles.productPill} ${identifiedProduct === p ? styles.active : ''}`}>
                      {p}
                    </span>
                  ))
                )}
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.messages}>
              <div className={`${styles.message} ${styles.assistant} ${styles.welcomeMessage}`}>
                <div className={styles.welcomeTitle}>👋 Welcome!</div>
                I'm your AI support assistant. Tell me what product you're working with and what issue you're experiencing, and I'll help you troubleshoot.
              </div>
              {messages.map((msg, i) => (
                <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>{line}<br/></span>
                  ))}
                </div>
              ))}
              {loading && (
                <div className={styles.typing}>
                  <span></span><span></span><span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputArea} onSubmit={sendMessage}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your issue..."
                autoComplete="off"
              />
              <button type="submit" disabled={loading || !productsLoaded}>
                {productsLoaded ? 'Send' : 'Loading...'}
              </button>
            </form>
          </div>

          <p className={styles.demoFooter}>Powered by Horizons AI</p>
          <p className={styles.demoDisclaimer}>
            This is a sample demo. Your version will be fully customized: trained on your actual support history,
            tuned to your top issues, with optional image recognition and multi-channel integration.
          </p>
        </div>

        {/* Right Side: Marketing Panel */}
        <div className={styles.marketingSide}>
          <div className={styles.marketingHeader}>
            <div className={styles.overline}>More Than a Chatbot</div>
            <h2>Complete AI Tech Support Infrastructure</h2>
            <p>This demo shows a fraction of what you get. Website chat, phone integration, real-time insights, and a growing lead list with upsell opportunities.</p>
          </div>

          {/* Integration Channels */}
          <div className={styles.channels}>
            <div className={styles.channelCard}>
              <div className={styles.channelIcon}>💬</div>
              <h4>Website Widget</h4>
              <p>Embed on your site in minutes</p>
            </div>
            <div className={styles.channelCard}>
              <div className={styles.channelIcon}>📞</div>
              <h4>Phone Integration</h4>
              <p>AI answers your support line</p>
            </div>
            <div className={styles.channelCard}>
              <div className={styles.channelIcon}>🌍</div>
              <h4>24/7 Multilingual</h4>
              <p>Always on, any language</p>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className={styles.dashboardSection}>
            <h3><span>📊</span> Real-Time Insights Dashboard</h3>
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <div className={styles.statValue}>127</div>
                <div className={styles.statLabel}>Queries Today</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>78%</div>
                <div className={styles.statLabel}>Auto-Resolved</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>2.1m</div>
                <div className={styles.statLabel}>Avg Response</div>
              </div>
            </div>

            <div className={styles.chartsRow}>
              <div className={styles.chartCard}>
                <div className={styles.chartCardTitle}>Support Volume by Product</div>
                <div className={styles.horizontalBars}>
                  {[
                    { label: 'Product 1', width: '92%', value: 156, color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
                    { label: 'Product 2', width: '74%', value: 125, color: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
                    { label: 'Product 3', width: '58%', value: 98, color: 'linear-gradient(90deg, #06b6d4, #67e8f9)' },
                    { label: 'Product 4', width: '35%', value: 59, color: 'linear-gradient(90deg, #10b981, #6ee7b7)' },
                  ].map((bar, i) => (
                    <div key={i} className={styles.hBarRow}>
                      <span className={styles.hBarLabel}>{bar.label}</span>
                      <div className={styles.hBarTrack}>
                        <div className={styles.hBarFill} style={{ width: bar.width, background: bar.color }}></div>
                      </div>
                      <span className={styles.hBarValue}>{bar.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartCardTitle}>Top Issues</div>
                <div className={styles.horizontalBars}>
                  {[
                    { label: "Won't Start", width: '85%', value: 42, color: 'linear-gradient(90deg, #ef4444, #f87171)' },
                    { label: 'Calibration', width: '63%', value: 31, color: 'linear-gradient(90deg, #f97316, #fb923c)' },
                    { label: 'Installation', width: '49%', value: 24, color: 'linear-gradient(90deg, #eab308, #facc15)' },
                    { label: 'Parts Needed', width: '35%', value: 17, color: 'linear-gradient(90deg, #22c55e, #4ade80)' },
                  ].map((bar, i) => (
                    <div key={i} className={styles.hBarRow}>
                      <span className={styles.hBarLabel}>{bar.label}</span>
                      <div className={styles.hBarTrack}>
                        <div className={styles.hBarFill} style={{ width: bar.width, background: bar.color }}></div>
                      </div>
                      <span className={styles.hBarValue}>{bar.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lead List Preview */}
          <div className={styles.leadList}>
            <h3><span>👥</span> Sales Lead List (Auto-Generated)</h3>
            {[
              { name: 'Mike Thompson', phone: '(555) 234-8891', product: 'Model 2400 Industrial Pump',
                transcript: '"The pump pressure keeps dropping after 20 minutes... we\'ve had this unit for about 4 years now"',
                tag: 'upsell', tagText: 'Upgrade Opportunity', note: 'Unit aging - recommend newer model' },
              { name: 'Sarah Chen', phone: '(555) 891-4422', product: 'ProMax 500 Controller',
                transcript: '"Need to replace the sensor module but not sure which part number to order"',
                tag: 'followup', tagText: 'Parts Sale', note: 'Ready to purchase, needs guidance' },
              { name: 'David Rodriguez', phone: '(555) 667-3310', product: 'Series X Compressor',
                transcript: '"We\'re expanding our facility and need 3 more units. What\'s the lead time?"',
                tag: 'urgent', tagText: 'Hot Lead', note: 'Multi-unit purchase intent' },
            ].map((lead, i) => (
              <div key={i} className={styles.leadItem}>
                <div className={styles.leadHeader}>
                  <span className={styles.leadName}>{lead.name}</span>
                  <span className={styles.leadPhone}>{lead.phone}</span>
                </div>
                <div className={styles.leadProduct}>Product: {lead.product}</div>
                <div className={styles.leadTranscript}>{lead.transcript}</div>
                <div className={styles.leadAction}>
                  <span className={`${styles.actionTag} ${styles[lead.tag]}`}>{lead.tagText}</span>
                  <span className={styles.actionNote}>{lead.note}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Parts E-Commerce Revenue */}
          <div className={styles.partsSection}>
            <h3><span>🛒</span> Direct Parts Revenue</h3>
            <div className={styles.partsCallout}>
              <div className={styles.partsCalloutIcon}>🔗</div>
              <div className={styles.partsCalloutText}>
                <strong>Auto-Detected Part Needs</strong>
                <p>When the AI detects a customer needs a replacement part, it automatically sends a direct link to your e-commerce store or parts catalog. No distributor markup, no lost sales.</p>
              </div>
            </div>
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <div className={styles.statValue}>$14.2k</div>
                <div className={styles.statLabel}>Parts Revenue (MTD)</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>68</div>
                <div className={styles.statLabel}>Orders via AI</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>34%</div>
                <div className={styles.statLabel}>Conversion Rate</div>
              </div>
            </div>
            <div className={styles.chartCard}>
              <div className={styles.chartCardTitle}>Parts Sales Through AI Support</div>
              <div className={styles.horizontalBars}>
                {[
                  { label: 'Filters & Seals', width: '88%', value: '$4,890', color: 'linear-gradient(90deg, #10b981, #34d399)' },
                  { label: 'Motor Assemblies', width: '72%', value: '$3,980', color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
                  { label: 'Sensor Modules', width: '55%', value: '$2,940', color: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
                  { label: 'Belts & Hoses', width: '38%', value: '$1,640', color: 'linear-gradient(90deg, #f97316, #fb923c)' },
                  { label: 'Control Boards', width: '22%', value: '$750', color: 'linear-gradient(90deg, #06b6d4, #67e8f9)' },
                ].map((bar, i) => (
                  <div key={i} className={styles.hBarRow}>
                    <span className={styles.hBarLabel}>{bar.label}</span>
                    <div className={styles.hBarTrack}>
                      <div className={styles.hBarFill} style={{ width: bar.width, background: bar.color }}></div>
                    </div>
                    <span className={styles.hBarValue}>{bar.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className={styles.benefitsGrid}>
            {[
              { icon: '⏱️', title: 'Save 60+ Hours/Month', desc: 'Resolve repetitive questions automatically' },
              { icon: '📈', title: 'Product Intelligence', desc: 'See which products have the most issues' },
              { icon: '💰', title: 'Direct Customer Access', desc: 'Build relationships, bypass distributors' },
              { icon: '🔄', title: 'Scalable Growth', desc: 'Handle more volume without more staff' },
            ].map((benefit, i) => (
              <div key={i} className={styles.benefitItem}>
                <div className={styles.benefitIcon}>{benefit.icon}</div>
                <div className={styles.benefitText}>
                  <h5>{benefit.title}</h5>
                  <p>{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
