import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Globe, Briefcase, Scale } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Canadian Nexus</h1>
          <Button onClick={() => navigate("/auth")}>
            Admin Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-foreground mb-6">
          Your Gateway to{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Canadian Settlement
          </span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Comprehensive settlement services, job assistance, and legal support
          for new immigrants in Canada
        </p>
        <Button size="lg" className="gap-2" onClick={() => navigate("/auth")}>
          Get Started
          <ArrowRight className="h-5 w-5" />
        </Button>
      </section>

      {/* Services Overview */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Our Services</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-lg p-6 shadow-card hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Settlement & Integration</h4>
            <p className="text-muted-foreground">
              Complete support for paperwork, housing, healthcare, schools, and banking
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-card hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-accent" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Job Assistance</h4>
            <p className="text-muted-foreground">
              Resume building, interview prep, and job placement support
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-card hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <Scale className="h-6 w-6" style={{ color: "hsl(var(--success))" }} />
            </div>
            <h4 className="text-xl font-semibold mb-2">Legal Support</h4>
            <p className="text-muted-foreground">
              Immigration paperwork, visa assistance, and legal guidance
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 Canadian Nexus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
