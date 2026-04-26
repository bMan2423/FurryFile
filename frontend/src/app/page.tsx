import Link from "next/link";
import { Heart, Calendar, MapPin, Users, Shield, Star } from "lucide-react";

const features = [
  { icon: Heart, title: "Pet Profiles", desc: "Keep detailed health records, photos, and notes for all your pets." },
  { icon: Calendar, title: "Vet Appointments", desc: "Book and manage appointments with certified veterinarians." },
  { icon: Users, title: "Pet Sitting", desc: "Find trusted sitters for boarding, day care, and walking." },
  { icon: MapPin, title: "Missing Pets", desc: "Report and find missing pets with location-based alerts." },
  { icon: Shield, title: "Adoptions", desc: "Browse adoptable pets from shelters and apply online." },
  { icon: Star, title: "Community Events", desc: "Join local pet events, meetups, and volunteer opportunities." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-900 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 rounded-full p-4">
              <Heart className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">FurryFile</h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            The all-in-one platform for pet owners, vets, sitters, and shelters.
            Everything your furry family needs, in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Everything for your pet&apos;s care
          </h2>
          <p className="text-center text-gray-500 mb-12">
            From health records to community events — we&apos;ve got it all covered.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-primary-50 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-500 mb-8">Join thousands of pet owners who trust FurryFile.</p>
          <Link
            href="/register"
            className="bg-primary-600 text-white px-10 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors inline-block"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} FurryFile. Made with ❤️ for pets.</p>
      </footer>
    </main>
  );
}
