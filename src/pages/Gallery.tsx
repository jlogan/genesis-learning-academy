import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Import GA Pre-K Week images
import prekReading1 from "@/assets/gallery-prek-reading-1.jpg";
import prekReading2 from "@/assets/gallery-prek-reading-2.jpg";
import prekGroupBooks from "@/assets/gallery-prek-group-books.jpg";
import kidsHandsTogether from "@/assets/gallery-kids-hands-together.jpg";
import teachersVisitor from "@/assets/gallery-teachers-visitor.jpg";

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

// Gentle Beginnings (Infants) gallery images
import gentleBeginning1 from "@/assets/gallery-gentle-beginning-1.jpg";
import gentleBeginning2 from "@/assets/gallery-gentle-beginning-2.jpg";
import gentleBeginning3 from "@/assets/gallery-gentle-beginning-3.jpg";
import gentleBeginning4 from "@/assets/gallery-gentle-beginning-4.jpg";
import gentleBeginning5 from "@/assets/gallery-gentle-beginning-5.jpg";
import gentleBeginningWalker from "@/assets/gallery-gentle-beginning-walker.png.asset.json";

type ProgramPhoto = {
  src: string;
  alt: string;
};

type ProgramGallery = {
  id: string;
  label: string;
  ageGroup: string;
  href: string;
  description: string;
  photos: ProgramPhoto[];
};

const programGalleries: ProgramGallery[] = [
  {
    id: "gentle-beginnings",
    label: "Gentle Beginnings",
    ageGroup: "Infants",
    href: "/programs#infants",
    description:
      "A calm and nurturing space for infants starting their growth journey.",
    photos: [
      { src: gentleBeginning1, alt: "Smiling infant standing in playpen reaching out" },
      { src: gentleBeginning2, alt: "Baby exploring sensory art activity at table" },
      { src: gentleBeginning3, alt: "Happy infant sitting on classroom rug" },
      { src: gentleBeginning4, alt: "Baby with pink headband holding a toy" },
      { src: gentleBeginning5, alt: "Infant crawling through colorful play tunnel" },
      { src: gentleBeginningWalker.url, alt: "Baby playing with bright activity walker toy" },
    ],
  },
  {
    id: "little-adventures",
    label: "Little Adventures",
    ageGroup: "Toddlers",
    href: "/programs#toddlers",
    description:
      "Toddlers exploring friendships, movement, and discovery through hands-on play.",
    photos: [
      { src: girlOutdoorPlay, alt: "Toddler enjoying outdoor play" },
      { src: happyChildPlayground, alt: "Child smiling on the playground" },
      { src: outdoorPlayNew, alt: "Children enjoying outdoor playground time" },
      { src: childConstructionPlay, alt: "Child building with construction toys" },
    ],
  },
  {
    id: "mini-makers",
    label: "Mini Makers",
    ageGroup: "Twos",
    href: "/programs#twos",
    description:
      "Creative, sensory-rich activities that help two-year-olds build confidence and independence.",
    photos: [
      { src: childArtActivity, alt: "Child creating art in the classroom" },
      { src: girlCraftActivity, alt: "Child engaged in a creative craft activity" },
      { src: kidsPlayingBlocks, alt: "Children playing together with building blocks" },
      { src: childSensoryBin, alt: "Child exploring a sensory bin activity" },
      { src: childSensoryTable, alt: "Child exploring sensory table materials" },
    ],
  },
  {
    id: "preschool-scholars",
    label: "Preschool Scholars",
    ageGroup: "Preschool",
    href: "/programs#preschool",
    description:
      "Classroom moments focused on early literacy, problem-solving, and positive peer relationships.",
    photos: [
      { src: classroomDecorations, alt: "Colorful preschool classroom with educational decorations" },
      { src: classroomLearningCorner, alt: "Preschool learning corner with classroom jobs display" },
      { src: childLearningTable, alt: "Preschool child learning phonics at an activity table" },
      { src: prekReading2, alt: "Story time with children engaged in reading" },
      { src: childLearningActivity, alt: "Child working on a classroom learning activity" },
    ],
  },
  {
    id: "transition-program",
    label: "Transition Program",
    ageGroup: "Pre-K & Summer",
    href: "/programs#prek",
    description:
      "Pre-K and summer learning experiences that help children prepare for their next step.",
    photos: [
      { src: prekReading1, alt: "Teacher reading to children during GA Pre-K Week" },
      { src: prekGroupBooks, alt: "Children and staff with books during GA Pre-K Week celebration" },
      { src: kidsHandsTogether, alt: "Children putting hands together in a teamwork activity" },
      { src: teachersVisitor, alt: "Teachers with a special visitor during Pre-K Week" },
    ],
  },
  {
    id: "junior-achievers",
    label: "Junior Achievers Program",
    ageGroup: "Afterschool & Summer Camp",
    href: "/programs#junior-achievers",
    description:
      "School-age care, summer camp, and community moments for growing learners.",
    photos: [
      { src: teachersTeamClassroom, alt: "Teachers engaging with students in the classroom" },
      { src: classroomInterior2, alt: "Genesis Learning Academy classroom interior" },
      { src: infantPlaytime, alt: "Child engaged in developmental play" },
      { src: infantCaregiver, alt: "Caregiver supporting a young child during play" },
      { src: genesisSignOutdoor, alt: "Genesis Learning Academy outdoor sign" },
    ],
  },
];

const Gallery = () => {
  return (
    <>
      <Helmet>
        <title>Photo Gallery - Genesis Learning Academy | Kennesaw Childcare</title>
        <meta
          name="description"
          content="Explore photos grouped by Genesis Learning Academy programs, including Gentle Beginnings, Little Adventures, Mini Makers, Preschool Scholars, the Transition Program, and Junior Achievers."
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
                Take a look at our classrooms, outdoor spaces, and the joyful moments that make Genesis Learning Academy special.
              </p>
            </div>
          </div>
        </section>

        {/* Program Gallery */}
        <section className="py-20 bg-warmBg/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Photos by Program
              </h2>
              <p className="text-lg text-muted-foreground">
                Browse classroom moments grouped by the same program names used across Genesis Learning Academy.
              </p>
            </div>

            <Tabs defaultValue={programGalleries[0].id} className="max-w-7xl mx-auto">
              <TabsList className="h-auto w-full flex flex-wrap justify-center gap-2 bg-background/80 p-2 rounded-2xl shadow-sm">
                {programGalleries.map((program) => (
                  <TabsTrigger
                    key={program.id}
                    value={program.id}
                    className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {program.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {programGalleries.map((program) => (
                <TabsContent key={program.id} value={program.id} className="mt-10">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-accent mb-2">
                        {program.ageGroup}
                      </p>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                        {program.label}
                      </h3>
                      <p className="text-muted-foreground mt-2 max-w-2xl">
                        {program.description}
                      </p>
                    </div>
                    <a
                      href={program.href}
                      className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      View program details
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {program.photos.map((image, index) => (
                      <Card
                        key={`${program.id}-${index}`}
                        className="group overflow-hidden hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative aspect-square overflow-hidden">
                          <img
                            src={image.src}
                            alt={image.alt}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                            {program.label}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
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
                href="/contact"
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