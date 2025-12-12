import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, FileText, Clock } from "lucide-react";

const Tuition = () => {
  const weeklyRates = [
    { program: "Infants (6 weeks – 12 months)", rate: "$275" },
    { program: "Toddlers (13 months – 2 years old)", rate: "$265" },
    { program: "Two-Year-Old", rate: "$255" },
    { program: "Three-Year-Old", rate: "$245" },
    { program: "Non-Potty", rate: "$235" },
    { program: "Before OR After School Care", rate: "$115" },
    { program: "Before AND After School Care", rate: "$150" },
    { program: "Summer Camp", rate: "$240" },
    { program: "Part-Time Care 8 hrs (6 weeks – 1 year old)", rate: "$190" },
    { program: "Part-Time Care 8 hrs (Two's)", rate: "$190" },
    { program: "Part-Time Care 8 hrs (Three's)", rate: "$190" },
  ];

  const dailyFees = [
    { feeType: "Early Release Days (Elementary Students)", rate: "$65 per day" },
    { feeType: "Drop-In Fee / Teacher Workdays", rate: "$100 per day" },
    { feeType: "Transportation", rate: "$75 per week" },
    { feeType: "Hourly Rate (Per Child)", rate: "$20 per hour" },
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tuition & Fees</h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Transparent pricing for quality child care in Kennesaw
          </p>
        </div>
      </section>

      {/* Registration Fee Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg max-w-4xl mx-auto">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">Registration Fee</h2>
              </div>
              
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                There is a non-refundable <span className="font-semibold text-foreground">$100.00</span> registration fee assessed during enrollment and annually in January. Upon payment of the registration fee, you will receive an enrollment packet.
              </p>

              <div className="bg-secondary/50 rounded-lg p-6 border-l-4 border-primary">
                <h3 className="font-semibold text-foreground mb-4 text-lg">Enrollment Packet Checklist</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>Genesis Learning Academy of Kennesaw Enrollment Form</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>Immunization Record (3231 Form)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>Parent ID</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>GA Pre-K Enrollment Form (for GA Pre-K students only)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>Birth Certificate, Social Security Card, Parent Driver's License, Proof of Address (GA Pre-K)</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Weekly Tuition Rates Section */}
      <section className="py-16 bg-warmBg">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg max-w-4xl mx-auto">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">Weekly Tuition Rates</h2>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="text-foreground font-bold text-base">Program</TableHead>
                      <TableHead className="text-foreground font-bold text-base text-right">Weekly Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyRates.map((item, index) => (
                      <TableRow key={index} className="hover:bg-secondary/30">
                        <TableCell className="text-muted-foreground py-4">{item.program}</TableCell>
                        <TableCell className="text-primary font-semibold text-right py-4">{item.rate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Daily Fees and Drop-In Fees Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg max-w-4xl mx-auto">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">Daily Fees & Drop-In Fees</h2>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="text-foreground font-bold text-base">Fee Type</TableHead>
                      <TableHead className="text-foreground font-bold text-base text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyFees.map((item, index) => (
                      <TableRow key={index} className="hover:bg-secondary/30">
                        <TableCell className="text-muted-foreground py-4">{item.feeType}</TableCell>
                        <TableCell className="text-primary font-semibold text-right py-4">{item.rate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimer Note */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-muted-foreground italic bg-secondary/30 rounded-lg p-4">
              Rates are subject to change. Please contact the front office to confirm current tuition and fees.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Tuition;
