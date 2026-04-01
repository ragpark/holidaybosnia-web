import { PrismaClient, Priority, RunStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'ops@holidaybosnia.com' },
    update: {},
    create: {
      email: 'ops@holidaybosnia.com',
      name: 'Holiday Bosnia Ops',
      role: UserRole.ops_manager,
    },
  });

  const inquirySeeds = [
    {
      senderName: 'Fatima Al-Rashid',
      senderEmail: 'fatima.alrashid@gmail.com',
      source: 'Contact form',
      subject: 'Family trip — 10 days, halal requirements',
      body: `Hi there,\n\nMy name is Fatima and I'm planning a family holiday to Bosnia-Herzegovina with my husband and three children (ages 6, 9 and 13). We are Muslim so halal food is essential for us.\n\nWe are thinking of 10 days, ideally in late July or August this year. Budget is moderate — we don't need luxury but we want comfortable accommodation.\n\nWe love history and culture, and the children enjoy outdoor activities. We've heard Mostar and Sarajevo are wonderful. Could you suggest an itinerary and let us know approximate costs?\n\nLooking forward to hearing from you!\nFatima`,
      unread: true,
      status: 'pending' as const,
      triage: {
        priority: Priority.High,
        priorityReason: 'Family group, specific duration and date window indicate strong purchase intent.',
        tripType: 'Family',
        duration: '10 days',
        groupSize: 'Family of 5',
        budget: 'Moderate',
        dates: 'Late July or August',
        halalRequired: true,
        urgency: 'Book soon',
        summary: 'Family of five seeking a 10-day halal-friendly Bosnia itinerary focused on culture plus light outdoor activities, with clear intent and timing.',
        recommendedPackage: '10-Day Grand Tour',
        actions: ['Share a family-oriented draft itinerary', 'Confirm exact travel dates', 'Provide indicative pricing by accommodation tier'],
        draftReply: 'Hi Fatima, thank you for your lovely message. We would be delighted to plan a 10-day halal-friendly family itinerary for you.',
      },
    },
    {
      senderName: 'James Whitmore',
      senderEmail: 'j.whitmore@outlook.com',
      source: 'Email',
      subject: 'Quick question re skiing — Feb half term',
      body: `Morning!\n\nWe're a group of 4 adults (2 couples) considering Bosnia for a ski trip over February half term (22–28 Feb). We're intermediate skiers and have been to Austria and Bulgaria before.\n\nA few questions:\n- How does Bjelašnica compare to other European resorts?\n- What's the après-ski like?\n- Do you offer a package that includes flights and accommodation?\n- Rough cost per person?\n\nThanks\nJames`,
      unread: true,
      status: 'pending' as const,
      triage: {
        priority: Priority.Medium,
        priorityReason: 'Specific dates and group are provided, but still in comparison phase.',
        tripType: 'Skiing',
        duration: '1 week',
        groupSize: '4 adults',
        budget: 'Unknown',
        dates: '22–28 Feb',
        halalRequired: false,
        urgency: 'Planning ahead',
        summary: 'Group ski inquiry for Feb half-term with clear comparison and pricing questions around value versus other European resorts.',
        recommendedPackage: 'Ski Package',
        actions: ['Share slope/transfer details', 'Provide per-person package ranges', 'Offer optional flight-included quote'],
        draftReply: 'Hi James, thanks for reaching out. Bosnia is an excellent value ski destination for intermediate groups, especially around Bjelašnica.',
      },
    },
    {
      senderName: 'Dr. Amara Osei',
      senderEmail: 'a.osei@nhs.net',
      source: 'WhatsApp',
      subject: 'Solo trip — history & walking, 7 days',
      body: `Hello,\n\nI'm a solo female traveller (40s) interested in a 7-day history and walking trip to Bosnia. I've travelled extensively in Turkey and Jordan so I'm familiar with Muslim-majority countries.\n\nI'm particularly interested in:\n- Sarajevo siege history and the War Tunnel\n- Ottoman heritage sites\n- Day hikes — nothing too strenuous but I do enjoy walking\n- Good local restaurants (halal preferred but not essential)\n\nIs Bosnia safe for solo female travellers? What time of year would you recommend? I'm flexible on dates — probably September or October.\n\nThanks so much,\nAmara`,
      unread: false,
      status: 'triaged' as const,
      triage: {
        priority: Priority.Medium,
        priorityReason: 'Well-scoped request with flexible dates and clear interests.',
        tripType: 'Solo',
        duration: '7 days',
        groupSize: 'Solo traveller',
        budget: 'Unknown',
        dates: 'September or October',
        halalRequired: false,
        urgency: 'Planning ahead',
        summary: 'Solo traveller focused on history and moderate walking asks about safety and ideal season, indicating strong informational intent.',
        recommendedPackage: '7-Day Classic Tour',
        actions: ['Answer safety question clearly', 'Propose a solo-friendly route', 'Offer optional guide add-ons for hikes'],
        draftReply: 'Hi Amara, thank you for your thoughtful message. Bosnia is generally very safe for solo female travellers in tourist corridors.',
      },
    },
    {
      senderName: 'Luka Petrović',
      senderEmail: 'luka.petrovic@protonmail.com',
      source: 'Contact form',
      subject: 'Group rafting + Sutjeska hiking — 6 people',
      body: `Hey,\n\nMe and 5 mates are planning an adventure trip to Bosnia — we want to do whitewater rafting on the Una River and possibly some hiking in Sutjeska National Park.\n\nWe're all in our late 20s and early 30s, pretty fit and looking for something challenging. We'd want about 6–8 days, budget is around £600–800 per person all in.\n\nCan you do a bespoke package for us? When's the best time for the Una? We're thinking June.\n\nCheers,\nLuka`,
      unread: false,
      status: 'pending' as const,
      triage: {
        priority: Priority.High,
        priorityReason: 'Group size, budget, activities, and preferred month are all specified.',
        tripType: 'Adventure',
        duration: '6–8 days',
        groupSize: '6 adults',
        budget: '£600–800pp',
        dates: 'June',
        halalRequired: false,
        urgency: 'Book soon',
        summary: 'Adventure-focused group with clear timing, budget, and activity asks for a bespoke package, indicating high conversion potential.',
        recommendedPackage: 'Rafting & Adventure',
        actions: ['Draft bespoke Una + Sutjeska plan', 'Confirm exact dates and fitness level', 'Quote transport/lodging inclusions'],
        draftReply: 'Hi Luka, brilliant plan. June is one of the best windows for Una rafting and we can absolutely build a bespoke 6–8 day adventure itinerary.',
      },
    },
  ];

  for (const seed of inquirySeeds) {
    const existing = await prisma.inquiry.findFirst({
      where: { senderEmail: seed.senderEmail, subject: seed.subject },
      select: { id: true },
    });

    const inquiry = existing
      ? await prisma.inquiry.update({
          where: { id: existing.id },
          data: {
            body: seed.body,
            unread: seed.unread,
            status: seed.status,
          },
        })
      : await prisma.inquiry.create({
          data: {
            source: seed.source,
            senderName: seed.senderName,
            senderEmail: seed.senderEmail,
            subject: seed.subject,
            body: seed.body,
            unread: seed.unread,
            status: seed.status,
          },
        });

    await prisma.triageResult.upsert({
      where: { inquiryId: inquiry.id },
      update: {
        ...seed.triage,
        actions: seed.triage.actions,
        model: 'claude-sonnet-4-20250514',
      },
      create: {
        inquiryId: inquiry.id,
        ...seed.triage,
        actions: seed.triage.actions,
        model: 'claude-sonnet-4-20250514',
      },
    });
  }

  const run = await prisma.pricingRun.create({
    data: {
      status: RunStatus.completed,
      requestedBy: admin.id,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  await prisma.pricingResult.create({
    data: {
      runId: run.id,
      summary:
        'Market conditions are strong for summer. Grand Tour is nearing capacity, while shoulder-season windows remain attractive for value-led campaigns.',
      tours: [
        { id: 'short', occupancyPct: 42, alertLevel: 'none', alertLabel: 'Good Availability', recommendedPrice: 580, priceAction: 'maintain' },
        { id: 'classic', occupancyPct: 71, alertLevel: 'med', alertLabel: 'Selling Well', recommendedPrice: 1050, priceAction: 'increase' },
        { id: 'grand', occupancyPct: 89, alertLevel: 'high', alertLabel: 'Filling Fast', recommendedPrice: 1620, priceAction: 'increase' },
        { id: 'kingdom', occupancyPct: 53, alertLevel: 'none', alertLabel: 'Good Availability', recommendedPrice: 1380, priceAction: 'maintain' },
        { id: 'ski', occupancyPct: 28, alertLevel: 'none', alertLabel: 'Early Season', recommendedPrice: 700, priceAction: 'reduce' },
        { id: 'raft', occupancyPct: 62, alertLevel: 'low', alertLabel: 'Moderate Demand', recommendedPrice: 500, priceAction: 'maintain' },
      ],
      airlines: [
        { airline: 'Wizz Air', route: 'LTN–SJJ', avgFare: '£89–£149', trend: 'flat', status: 'Good availability' },
        { airline: 'Turkish Airlines', route: 'LHR–IST–SJJ', avgFare: '£210–£340', trend: 'up', status: 'Summer selling fast' },
        { airline: 'Lufthansa', route: 'LHR–FRA–SJJ', avgFare: '£245–£390', trend: 'flat', status: 'Reliable inventory' },
        { airline: 'Austrian Airlines', route: 'LHR–VIE–SJJ', avgFare: '£230–£360', trend: 'down', status: 'Value windows available' },
        { airline: 'FlyNas', route: 'RUH–SJJ', avgFare: 'SAR 890–1,400', trend: 'up', status: 'Strong Gulf demand' },
      ],
      recommendations: [
        { type: 'alert', title: 'Grand Tour Capacity Alert', body: 'At 89% booked for summer, Grand Tour may fill soon.', meta: 'Consider opening a second departure.' },
        { type: 'price', title: 'Raise Classic Tour by £70pp', body: 'Demand is ahead of seasonal average.', meta: 'Comparable operators are priced higher.' },
      ],
      rawModelOutput: { source: 'seed', model: 'claude-sonnet-4-20250514' },
    },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
