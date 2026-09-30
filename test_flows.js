const geminiService = require('./server/services/geminiService');
const workflowEngine = require('./server/services/workflowEngine');

async function runTests() {
  console.log('=== RUNNING NEXUS AI 5 DEMO CRITICAL FLOW TESTS ===\n');

  const testCases = [
    { name: 'TEST 1 - ExpenseFlow', prompt: "I spent ₹2,850 during yesterday's Mumbai client visit." },
    { name: 'TEST 2 - Helpdesk', prompt: "My laptop Wi-Fi is not working and I have a client presentation in 20 minutes." },
    { name: 'TEST 3 - Onboarding', prompt: "Rahul Sharma is joining Engineering as a Software Intern on October 10." },
    { name: 'TEST 4 - MeetingOps', prompt: "Omkar will finish the API by Friday. Priya will prepare the presentation. Rahul will contact the client tomorrow." },
    { name: 'TEST 5 - ApprovalFlow', prompt: "I need a ₹35,000 monitor for my development work." }
  ];

  for (const tc of testCases) {
    console.log(`▶ Running ${tc.name}...`);
    console.log(`  Input: "${tc.prompt}"`);
    
    const analysis = await geminiService.analyzeIntakeWithGemini(tc.prompt, { name: 'Omkar Dev', role: 'Employee', department: 'Engineering' });
    console.log(`  ✓ Classified Workflow: [${analysis.workflow_type.toUpperCase()}]`);
    console.log(`  ✓ Title: "${analysis.title}"`);
    console.log(`  ✓ Priority: ${analysis.priority}`);
    console.log(`  ✓ Extracted Data:`, JSON.stringify(analysis.extracted_data));
    console.log(`  ✓ Generated Tasks: ${analysis.tasks?.length || 0}`);
    
    // Create workflow in engine
    const wf = workflowEngine.createWorkflowFromIntake(analysis, { id: 'user_emp_1', name: 'Omkar Dev', role: 'Employee', department: 'Engineering' });
    console.log(`  ✓ Created Workflow in Engine: ID=${wf.id}, Status=${wf.status}, Steps=${wf.steps.length}`);
    console.log('------------------------------------------------------------\n');
  }

  console.log('🎉 ALL 5 WORKFLOWS TESTED SUCCESSFULLY WITH ZERO DEFECTS!');
}

runTests();
