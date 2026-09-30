const { supabase } = require('./supabase');

const SEED_USERS = [
  {
    email: 'admin@nexus.ai',
    password: 'Password123!',
    full_name: 'Elena Rostova',
    role: 'admin',
    department: 'Executive Operations',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'sarah.mgr@nexus.ai',
    password: 'Password123!',
    full_name: 'Sarah Connor',
    role: 'manager',
    department: 'Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'omkar@nexus.ai',
    password: 'Password123!',
    full_name: 'Omkar Dev',
    role: 'employee',
    department: 'Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'alex.it@nexus.ai',
    password: 'Password123!',
    full_name: 'Alex Rivera',
    role: 'it',
    department: 'IT Support',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'vikram.fin@nexus.ai',
    password: 'Password123!',
    full_name: 'Vikram Mehta',
    role: 'finance',
    department: 'Finance',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'priya.hr@nexus.ai',
    password: 'Password123!',
    full_name: 'Priya Sharma',
    role: 'hr',
    department: 'People Operations',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  }
];

async function seed() {
  console.log('🌱 Starting Supabase database seeding...');

  const userMap = {};

  for (const u of SEED_USERS) {
    try {
      // Check if user already exists
      const { data: listData } = await supabase.auth.admin.listUsers();
      let existing = listData?.users?.find(x => x.email === u.email);

      let userId;
      if (!existing) {
        console.log(`Creating auth user: ${u.email}`);
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: {
            full_name: u.full_name,
            role: u.role,
            department: u.department,
            avatar_url: u.avatar_url
          }
        });
        if (createErr) {
          console.error(`Error creating ${u.email}:`, createErr.message);
          continue;
        }
        userId = created.user.id;
      } else {
        userId = existing.id;
      }

      userMap[u.role] = userId;
      userMap[u.email] = userId;

      // Upsert profile
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        department: u.department,
        avatar_url: u.avatar_url
      });

      console.log(`✓ Profile ready for: ${u.full_name} (${u.role}) [${userId}]`);
    } catch (err) {
      console.error(`Failed to seed user ${u.email}:`, err.message);
    }
  }

  // Check if workflows exist
  const { data: existingWfs } = await supabase.from('workflows').select('id');
  if (existingWfs && existingWfs.length > 0) {
    console.log(`Workflows already exist (${existingWfs.length} found). Skipping workflow seeding.`);
    return;
  }

  const employeeId = userMap['employee'] || Object.values(userMap)[0];
  const managerId = userMap['manager'] || employeeId;
  const itId = userMap['it'] || employeeId;
  const financeId = userMap['finance'] || employeeId;
  const hrId = userMap['hr'] || employeeId;

  console.log('Seeding initial workflows...');

  // 1. Equipment Approval Workflow
  const { data: wf1 } = await supabase.from('workflows').insert({
    created_by: employeeId,
    workflow_type: 'approval',
    title: 'Ergonomic 4K UltraWide Monitor for Engineering',
    summary: 'Request for high-resolution dual workstation monitor to accelerate development.',
    status: 'awaiting_approval',
    priority: 'normal',
    department: 'Engineering',
    ai_data: {
      amount: 35000,
      currency: 'INR',
      category: 'Equipment',
      reason: 'Development workstation setup and multi-screen productivity',
      department: 'Engineering',
      recommended_route: 'Manager Approval -> IT Provisioning'
    },
    risk_flags: [],
    missing_information: [],
    current_step: 'Manager Approval'
  }).select().single();

  if (wf1) {
    await supabase.from('approvals').insert({
      workflow_id: wf1.id,
      approver_id: managerId,
      approver_role: 'manager',
      status: 'pending'
    });

    await supabase.from('tasks').insert([
      {
        workflow_id: wf1.id,
        title: 'Verify budget allocation under Q3 Dev Tools',
        assignee_id: managerId,
        assignee_role: 'manager',
        assignee_name: 'Sarah Connor',
        status: 'pending',
        priority: 'normal'
      },
      {
        workflow_id: wf1.id,
        title: 'Issue PO & Arrange IT Hardware Delivery',
        assignee_id: itId,
        assignee_role: 'it',
        assignee_name: 'Alex Rivera',
        status: 'pending',
        priority: 'normal'
      }
    ]);

    await supabase.from('activity_logs').insert({
      workflow_id: wf1.id,
      actor_type: 'ai',
      action: 'workflow_created',
      description: 'AI classified request as Equipment Approval and routed to Sarah Connor.'
    });
  }

  // 2. Expense Claim Workflow
  const { data: wf2 } = await supabase.from('workflows').insert({
    created_by: employeeId,
    workflow_type: 'expense',
    title: 'Mumbai Client Visit Travel & Dining Expense',
    summary: 'Travel reimbursement for client technical kickoff meeting at BKC Mumbai.',
    status: 'awaiting_approval',
    priority: 'normal',
    department: 'Engineering',
    ai_data: {
      amount: 2850,
      currency: 'INR',
      category: 'Travel & Meals',
      purpose: 'Client technical kickoff meeting at Mumbai BKC Office',
      within_daily_allowance: true
    },
    risk_flags: [],
    missing_information: [],
    current_step: 'Manager Approval'
  }).select().single();

  if (wf2) {
    await supabase.from('approvals').insert({
      workflow_id: wf2.id,
      approver_id: managerId,
      approver_role: 'manager',
      status: 'pending'
    });

    await supabase.from('tasks').insert([
      {
        workflow_id: wf2.id,
        title: 'Review cab receipts & client visit agenda',
        assignee_id: managerId,
        assignee_role: 'manager',
        assignee_name: 'Sarah Connor',
        status: 'pending',
        priority: 'normal'
      },
      {
        workflow_id: wf2.id,
        title: 'Disburse reimbursement to payroll account',
        assignee_id: financeId,
        assignee_role: 'finance',
        assignee_name: 'Vikram Mehta',
        status: 'pending',
        priority: 'normal'
      }
    ]);

    await supabase.from('activity_logs').insert({
      workflow_id: wf2.id,
      actor_type: 'ai',
      action: 'workflow_created',
      description: 'AI verified expense policy compliance (within ₹5,000 allowance).'
    });
  }

  // 3. IT Helpdesk with critical SLA
  const { data: wf3 } = await supabase.from('workflows').insert({
    created_by: employeeId,
    workflow_type: 'helpdesk',
    title: 'Executive Laptop Wi-Fi / VPN Connectivity Failure',
    summary: 'Urgent network failure before client presentation.',
    status: 'in_progress',
    priority: 'critical',
    department: 'Engineering',
    ai_data: {
      issue: 'Wi-Fi / VPN connectivity loss',
      urgency: 'Immediate',
      device: 'MacBook Pro M3',
      sla_minutes: 30
    },
    risk_flags: ['High business impact - client demo scheduled in 20 min'],
    missing_information: [],
    sla_due_at: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    current_step: 'IT Diagnostics & Resolution'
  }).select().single();

  if (wf3) {
    await supabase.from('tasks').insert([
      {
        workflow_id: wf3.id,
        title: 'Provide backup 5G Hotspot & remote diagnostics',
        assignee_id: itId,
        assignee_role: 'it',
        assignee_name: 'Alex Rivera',
        status: 'in_progress',
        priority: 'critical'
      }
    ]);

    await supabase.from('alerts').insert({
      workflow_id: wf3.id,
      severity: 'critical',
      type: 'sla_risk',
      title: 'Critical IT Ticket SLA Warning',
      message: 'Wi-Fi failure ticket requires resolution within 25 minutes.',
      assigned_role: 'it',
      assigned_user_id: itId,
      status: 'active'
    });

    await supabase.from('activity_logs').insert({
      workflow_id: wf3.id,
      actor_type: 'ai',
      action: 'sla_timer_started',
      description: 'Critical priority SLA timer initiated (30 minutes max response time).'
    });
  }

  // 4. Onboarding Workflow
  const { data: wf4 } = await supabase.from('workflows').insert({
    created_by: hrId,
    workflow_type: 'onboarding',
    title: 'New Hire Onboarding — Rahul Sharma (Software Intern)',
    summary: 'Onboarding schedule, laptop provisioning, and Google Workspace creation for Rahul Sharma.',
    status: 'in_progress',
    priority: 'normal',
    department: 'Engineering',
    ai_data: {
      candidate_name: 'Rahul Sharma',
      role: 'Software Engineering Intern',
      start_date: '2026-10-10',
      mentor: 'Omkar Dev',
      department: 'Engineering'
    },
    risk_flags: [],
    missing_information: [],
    current_step: 'IT & Workspace Provisioning'
  }).select().single();

  if (wf4) {
    await supabase.from('tasks').insert([
      {
        workflow_id: wf4.id,
        title: 'Create Google Workspace email & Slack credentials',
        assignee_id: itId,
        assignee_role: 'it',
        assignee_name: 'Alex Rivera',
        status: 'pending',
        priority: 'normal'
      },
      {
        workflow_id: wf4.id,
        title: 'Schedule 1-on-1 welcome meeting with engineering mentor',
        assignee_id: hrId,
        assignee_role: 'hr',
        assignee_name: 'Priya Sharma',
        status: 'pending',
        priority: 'normal'
      }
    ]);

    await supabase.from('activity_logs').insert({
      workflow_id: wf4.id,
      actor_type: 'ai',
      action: 'onboarding_initialized',
      description: 'AI extracted onboarding requirements and assigned tasks across HR & IT.'
    });
  }

  console.log('✅ Seed completed successfully with initial users, workflows, tasks, approvals, and alerts!');
}

seed().catch(err => {
  console.error('Seed execution error:', err);
});
