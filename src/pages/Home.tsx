import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  BarChart3,
  Server,
  Mail,
  GitBranch,
  Shield,
  Zap,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Award,
  Database,
  Eye,
  Monitor,
  GitCommit,
} from "lucide-react";

const Home = () => {
  const features = [
    {
      icon: Rocket,
      title: "CI/CD Pipeline Automation",
      description:
        "Automate build, testing, and deployment of SAP Integration Suite artifacts with our intelligent 8-stage pipeline.",
      bulletPoints: [
        "Package & iFlow Management",
        "Configuration Validation",
        "Automated Testing & Deployment",
        "Compliance Checking",
      ],
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      link: "/pipeline",
    },
    {
      icon: BarChart3,
      title: "Real-time Dashboard",
      description:
        "Monitor and manage CI/CD pipelines with comprehensive visualizations and real-time status updates.",
      bulletPoints: [
        "Pipeline Performance Metrics",
        "Success/Failure Analytics",
        "Real-time Status Monitoring",
        "Role-based Access Control",
      ],
      color: "bg-gradient-to-br from-green-500 to-green-600",
      link: "/dashboard",
    },
    {
      icon: Server,
      title: "Environment Management",
      description:
        "Securely manage connection details and configurations across multiple environments.",
      bulletPoints: [
        "Multi-environment Support",
        "Secure Credential Storage",
        "Connection Validation",
        "Easy Configuration Updates",
      ],
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      link: "/environments",
    },
    {
      icon: Mail,
      title: "24/7 Support",
      description:
        "Get expert support and connect with our team for assistance with your CI/CD automation needs.",
      bulletPoints: [
        "Expert Technical Support",
        "Direct Communication",
        "Issue Reporting",
        "24/7 Assistance",
      ],
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      link: "/contact",
    },
  ];

  const stats = [
    {
      icon: GitBranch,
      label: "Active Pipelines",
      value: "12",
      change: "+3 this week",
      color: "text-blue-600",
    },
    {
      icon: CheckCircle,
      label: "Success Rate",
      value: "98.5%",
      change: "+2.1% this month",
      color: "text-green-600",
    },
    {
      icon: Clock,
      label: "Avg Deploy Time",
      value: "3.2 min",
      change: "-45s faster",
      color: "text-purple-600",
    },
    {
      icon: Shield,
      label: "Security Score",
      value: "A+",
      change: "Excellent",
      color: "text-indigo-600",
    },
  ];

  const whyChooseUs = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Reduce deployment time by 80% with automated pipelines",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with comprehensive audit trails",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: Monitor,
      title: "24/7 Monitoring",
      description: "Continuous monitoring with real-time alerts",
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      icon: GitCommit,
      title: "Version Control",
      description: "Integrated Git support with rollback capabilities",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      icon: Database,
      title: "Data Integrity",
      description: "Ensure data consistency across all environments",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
    },
    {
      icon: Eye,
      title: "Real-time Insights",
      description: "Comprehensive analytics and performance metrics",
      color: "text-pink-500",
      bgColor: "bg-pink-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <div className="relative px-6 py-24 text-center">
          <div className="mx-auto max-w-4xl">
            <div className="flex justify-center mb-6">
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-medium">
                <Star className="w-4 h-4 mr-2" />
                Enterprise SAP Integration Platform
              </Badge>
            </div>

            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent leading-tight mb-6">
              SAP CI/CD
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Automation Hub
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Streamline your SAP Integration Suite deployments with our
              enterprise-grade automation platform. Deploy faster, test smarter,
              and scale effortlessly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/pipeline">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Pipeline
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link to="/dashboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 font-semibold px-8 py-4 rounded-xl transition-all duration-300"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-6 py-16 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 ${stat.color}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.label}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        {stat.change}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              Complete CI/CD Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to automate, monitor, and manage your SAP
              Integration Suite deployments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link key={index} to={feature.link}>
                  <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden group">
                    <div
                      className={`h-2 ${feature.color.replace("bg-gradient-to-br", "bg-gradient-to-r")}`}
                    ></div>
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-4 rounded-2xl ${feature.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                            {feature.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-lg text-gray-600 leading-relaxed mb-4">
                        {feature.description}
                      </CardDescription>

                      {feature.bulletPoints && (
                        <ul className="space-y-2 mb-6">
                          {feature.bulletPoints.map((point, idx) => (
                            <li
                              key={idx}
                              className="flex items-center text-gray-600"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {point}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700 transition-colors duration-300">
                        <span>Explore Feature</span>
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Why Choose Our Platform Section */}
      <div className="px-6 py-16 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for SAP Integration Suite with enterprise-grade
              features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChooseUs.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card
                  key={index}
                  className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                >
                  <CardContent className="p-8 text-center">
                    <div className="mb-6">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${item.bgColor} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className={`w-8 h-8 ${item.color}`} />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                      {item.title}
                    </h3>

                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 py-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="mx-auto max-w-4xl text-center">
          <Award className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Deployments?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of SAP professionals who trust our platform for their
            critical integrations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pipeline">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-50 font-semibold px-8 py-4 rounded-xl shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Get Started Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white bg-white/10 hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 rounded-xl transition-all duration-300"
              >
                <Users className="w-5 h-5 mr-2" />
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Ribbon */}
      <div className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">
              SAP CI/CD Automation Platform
            </span>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 SAP CI/CD Platform. Built for enterprise automation.
          </div>
        </div>
      </div>

      {/* Background decorations */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
    </div>
  );
};

export default Home;
