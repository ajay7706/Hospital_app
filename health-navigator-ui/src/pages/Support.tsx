import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How to book an appointment?',
    answer:
      'Go to the Hospitals page, find a hospital, and click "Book Visit". Fill in your details, select a date and time, then confirm your appointment.',
  },
  {
    question: 'How to register a hospital?',
    answer:
      'Click "Sign Up", select the "Hospital" role, and create your account. After signing up, complete the Hospital Setup form with your hospital details.',
  },
  {
    question: 'How to contact support?',
    answer:
      'You can reach us via email at support@bookvisit.com or call us at +91 9876543210. Our support team is available Monday to Saturday, 9 AM to 6 PM.',
  },
];

const Support = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Support Center</h1>
            <p className="mt-3 text-muted-foreground">
              We're here to help you with anything you need
            </p>
          </div>

          {/* Contact Info */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">support@bookvisit.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">+91 9876543210</p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
