import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Compass, Cpu, Layers, Shield } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F4ED] py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              About FormaSpace
            </span>
            <h1 className="mt-3 font-editorial text-4xl font-semibold text-[#172B3A] sm:text-5xl">
              Where architectural restraint meets spatial intelligence.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[#252B2E]/80">
              FormaSpace was created for architects, interior studios, property stagers, and discerning homeowners who believe visualization should honor structural integrity, natural daylight, and tactile materiality.
            </p>
            <div className="mt-7 flex gap-4">
              <Link to="/studio" className="btn-primary">
                Launch Studio <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/explore" className="btn-secondary">
                Explore Styles
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-[#DCCBB5] bg-white p-3 shadow-editorial">
              <img
                src="/images/style-japandi.jpg"
                alt="FormaSpace Studio"
                className="h-80 w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Compass, title: "Structure First", desc: "Four intervention tiers protect window proportions, ceiling lines, and spatial depth." },
            { icon: Layers, title: "Full Lifecycle", desc: "Move fluidly from 2D floor plans and sketches to furnished renders, furniture sourcing, and budgets." },
            { icon: Cpu, title: "Modular Design Engine", desc: "Configurable backend image-editing adapters supporting OpenAI, Gemini, Stability, or local Demo simulation." },
            { icon: Shield, title: "Private by Design", desc: "Per-user isolated projects, folders, and uploads backed by Supabase PostgreSQL & Auth." },
          ].map((c) => (
            <div key={c.title} className="editorial-card p-6">
              <c.icon className="h-6 w-6 text-[#C87960]" />
              <h2 className="mt-4 font-editorial text-xl font-semibold text-[#172B3A]">{c.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-[#252B2E]/75">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

