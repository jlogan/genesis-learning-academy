import { Card } from "@/components/ui/card";
import { Helmet } from "react-helmet";

// Import new gallery images
import kidsPlayingBlocks from "@/assets/gallery-kids-playing-blocks.jpg";
import classroomDecorations from "@/assets/gallery-classroom-decorations.jpg";
import classroomLearningCorner from "@/assets/gallery-classroom-learning-corner.jpg";
import childLearningTable from "@/assets/gallery-child-learning-table.jpg";
import childSensoryBin from "@/assets/gallery-child-sensory-bin.jpg";
import infantPlaytime from "@/assets/gallery-infant-playtime.jpg";
import girlCraftActivity from "@/assets/gallery-girl-craft-activity.jpg";
import girlOutdoorPlay from "@/assets/gallery-girl-outdoor-play.jpg";

// Import existing images from website
import childArtActivity from "@/assets/child-art-activity.jpg";
import childConstructionPlay from "@/assets/child-construction-play.jpg";
import childLearningActivity from "@/assets/child-learning-activity.jpg";
import childSensoryTable from "@/assets/child-sensory-table.jpg";
import classroomInterior1 from "@/assets/classroom-interior-1.jpg";
import classroomInterior2 from "@/assets/classroom-interior-2.jpg";
import happyChildPlayground from "@/assets/happy-child-playground.jpg";
import infantCaregiver from "@/assets/infant-caregiver.jpg";
import outdoorPlayNew from "@/assets/outdoor-play-new.jpg";
import teachersTeamClassroom from "@/assets/teachers-team-classroom.jpg";
import genesisSignOutdoor from "@/assets/genesis-sign-outdoor.jpg";

const galleryImages = [
  { src: girlOutdoorPlay, alt: "Happy child enjoying outdoor play" },
  { src: classroomDecorations, alt: "Colorful classroom with educational decorations" },
  { src: classroomLearningCorner, alt: "Learning corner with classroom jobs display" },
  { src: childLearningTable, alt: "Child learning phonics at activity table" },
  { src: kidsPlayingBlocks, alt: "Children playing together with building blocks" },
  { src: childSensoryBin, alt: "Child exploring sensory bin activity" },
  { src: infantPlaytime, alt: "Infant engaged in developmental play" },
  { src: teachersTeamClassroom, alt: "Teachers engaging with students" },
  { src: genesisSignOutdoor, alt: "Genesis Learning Academy outdoor sign" },
  { src: girlCraftActivity, alt: "Child engaged in creative craft activity" },
];

const Gallery = () => {
  return (
    <>
      <Helmet>
        <title>Photo Gallery - Genesis Learning Academy | Kennesaw Childcare</title>
        <meta 
          name="description" 
          content="Explore photos of our vibrant learning environment, classrooms, outdoor play areas, and children engaged in educational activities at Genesis Learning Academy in Kennesaw, GA."
        />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-6xl">🎨</div>
            <div className="absolute top-20 right-20 text-5xl">🧸</div>
            <div className="absolute bottom-16 left-1/4 text-4xl">🎭</div>
            <div className="absolute top-32 right-1/3 text-5xl">🎪</div>
            <div className="absolute bottom-20 right-16 text-6xl">🎨</div>
            <div className="absolute top-16 left-1/3 text-4xl">🎯</div>
            <div className="absolute bottom-32 left-20 text-5xl">🎨</div>
            <div className="absolute top-40 right-1/4 text-4xl">🧩</div>
          </div>
          
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${classroomInterior1})` }}
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Photo Gallery</h1>
              <p className="text-lg text-primary-foreground/95">
                Take a look at our classrooms, outdoor spaces, and the joyful moments that make Genesis Learning Academy special
              </p>
            </div>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image, index) => (
                <Card 
                  key={index}
                  className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ready to Visit Us?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Schedule a tour to see our facility in person and meet our dedicated team
              </p>
              <a
                href="/enroll"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Schedule a Tour
              </a>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
};

export default Gallery;
