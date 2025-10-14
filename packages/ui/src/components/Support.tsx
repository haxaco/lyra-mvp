import React, { useState } from 'react';
import { Button } from '../primitives/button';
import { 
  MessageCircle, 
  Book, 
  Mail, 
  Phone, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Search
} from 'lucide-react';

export const Support: React.FC = () => {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });

  const faqs = [
    {
      id: '1',
      question: 'How does AI music generation work?',
      answer: 'Lyra uses advanced AI models from providers like Mubert, Suno, and MusicGen to create unique, royalty-free music tailored to your brand. Simply select your desired mood, energy level, and genre, and our AI will generate a custom playlist in minutes.'
    },
    {
      id: '2',
      question: 'Are the generated playlists copyright-free?',
      answer: 'Yes! All music generated through Lyra comes with full commercial usage rights and public performance licenses. You can use the music in your business without worrying about copyright claims or additional licensing fees.'
    },
    {
      id: '3',
      question: 'Can I customize the music to match my brand?',
      answer: 'Absolutely! During onboarding, you provide information about your brand identity, target atmosphere, and music preferences. Our AI uses this data to generate playlists that perfectly match your brand\'s vibe and your customers\' expectations.'
    },
    {
      id: '4',
      question: 'How many playlists can I create?',
      answer: 'This depends on your plan. The Starter plan includes 5 custom playlists, the Professional plan offers unlimited playlists, and Enterprise customers get unlimited playlists plus custom AI model training for even more personalized results.'
    },
    {
      id: '5',
      question: 'What happens if I exceed my monthly hours?',
      answer: 'If you approach your monthly streaming limit, we\'ll send you a notification. You can either upgrade your plan or purchase additional hours. Don\'t worry—your music won\'t stop playing; we\'ll just add overage charges to your next invoice.'
    },
    {
      id: '6',
      question: 'Can I manage multiple locations?',
      answer: 'Yes! Professional and Enterprise plans include multi-location management. You can create different playlists for each location, monitor analytics separately, and manage team access across all your venues from one dashboard.'
    },
    {
      id: '7',
      question: 'How do I integrate Lyra with my existing sound system?',
      answer: 'Lyra works with any sound system that has a device capable of playing music from the web. Simply use our web player on a computer, tablet, or phone connected to your speakers. We also offer API access for custom integrations on Professional and Enterprise plans.'
    },
    {
      id: '8',
      question: 'What kind of analytics do you provide?',
      answer: 'Our analytics dashboard shows hours streamed, skip rates, customer engagement metrics, most popular tracks, peak listening times, and cost analysis. Professional plans get advanced insights including demographic data and A/B testing results.'
    }
  ];

  const quickLinks = [
    { title: 'Getting Started Guide', icon: Book, url: '#' },
    { title: 'API Documentation', icon: Book, url: '#' },
    { title: 'Video Tutorials', icon: ExternalLink, url: '#' },
    { title: 'Community Forum', icon: MessageCircle, url: '#' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting support request:', formData);
    // Reset form
    setFormData({ subject: '', message: '', priority: 'normal' });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#FF6F61]/10 via-[#E6B8C2]/10 to-transparent rounded-[16px] p-8 border border-primary/20">
        <h1 className="text-foreground mb-2">Help Center</h1>
        <p className="text-muted-foreground mb-6">
          Get help with Lyra, browse our documentation, or contact support
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for help articles, guides, or FAQs..."
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-4 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.title}
              href={link.url}
              className="bg-card rounded-[16px] p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gradient-coral flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-foreground">{link.title}</p>
              </div>
            </a>
          );
        })}
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-card rounded-[16px] p-6 border border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-foreground">Live Chat</h3>
              <p className="text-muted-foreground">
                Chat with our support team in real-time
              </p>
              <Button className="mt-2 bg-gradient-coral text-white hover:opacity-90">
                Start Chat
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[16px] p-6 border border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-foreground">Email Support</h3>
              <p className="text-muted-foreground">
                We typically respond within 24 hours
              </p>
              <p className="text-primary">support@lyra.ai</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[16px] p-6 border border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-foreground">Phone Support</h3>
              <p className="text-muted-foreground">
                Mon-Fri, 9am-6pm EST
              </p>
              <p className="text-primary">+1 (555) 123-4567</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-card rounded-[16px] p-6 border border-border">
        <h2 className="text-foreground mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-border rounded-lg overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-foreground text-left">{faq.question}</span>
                {expandedFaq === faq.id ? (
                  <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {expandedFaq === faq.id && (
                <div className="p-4 pt-0 border-t border-border bg-secondary/10">
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-card rounded-[16px] p-6 border border-border">
        <h2 className="text-foreground mb-4">Submit a Support Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-foreground">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-foreground">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="low">Low - General question</option>
                <option value="normal">Normal - Issue affecting workflow</option>
                <option value="high">High - Service disruption</option>
                <option value="urgent">Urgent - Critical issue</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-foreground">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please describe your issue in detail..."
              rows={6}
              className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-muted-foreground">
              We'll respond to your email within 24 hours
            </p>
            <Button type="submit" className="bg-gradient-coral text-white hover:opacity-90">
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
