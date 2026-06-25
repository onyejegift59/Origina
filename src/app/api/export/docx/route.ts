import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProject, getProjectArtifacts, createExportRecord } from '@/lib/supabase/queries';
import { safeFileName } from '@/lib/security';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: { message: 'Project ID is required' } },
      { status: 400 }
    );
  }

  const project = await getProject(projectId, user.id);
  if (!project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found' } },
      { status: 404 }
    );
  }

  const artifacts = await getProjectArtifacts(projectId);
  const artifactMap = artifacts.reduce((acc, a) => {
    acc[a.type] = a.content;
    return acc;
  }, {} as Record<string, unknown>);

  const children: Paragraph[] = [];

  function addHeading(text: string, level: number) {
    children.push(
      new Paragraph({
        text,
        heading: level > 0 ? `Heading${level}` as any : undefined,
        spacing: { before: 300, after: 200 },
      })
    );
  }

  function addBody(text: string) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text, size: 22 })],
        spacing: { after: 120 },
      })
    );
  }

  function addList(items: string[]) {
    for (const item of items) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `- ${item}`, size: 22 })],
          spacing: { after: 60 },
          indent: { left: 400 },
        })
      );
    }
  }

  addHeading(project.name, 0);
  addBody(`Idea: ${project.idea}`);
  addBody(`Problem: ${project.problem_description || 'Not specified'}`);

  const analysis = artifactMap['startup_analysis'] as any;
  if (analysis) {
    addHeading('Startup Analysis', 1);
    addHeading('Problem Statement', 2);
    addBody(analysis.problemStatement || '');
    addHeading('Target Audience', 2);
    addBody(analysis.targetAudience || '');
    addHeading('Value Proposition', 2);
    addBody(analysis.valueProposition || '');
    addHeading('Market Opportunity', 2);
    addBody(analysis.marketOpportunity || '');
    if (analysis.risks?.length) {
      addHeading('Risks', 2);
      addList(analysis.risks);
    }
    if (analysis.recommendations?.length) {
      addHeading('Recommendations', 2);
      addList(analysis.recommendations);
    }
  }

  const personas = artifactMap['personas'] as any;
  if (personas?.personas) {
    addHeading('User Personas', 1);
    for (const p of personas.personas) {
      addHeading(`${p.name} - ${p.role}`, 2);
      if (p.goals?.length) { addHeading('Goals', 3); addList(p.goals); }
      if (p.painPoints?.length) { addHeading('Pain Points', 3); addList(p.painPoints); }
      if (p.motivations?.length) { addHeading('Motivations', 3); addList(p.motivations); }
    }
  }

  const mvp = artifactMap['mvp_scope'] as any;
  if (mvp) {
    addHeading('MVP Scope', 1);
    if (mvp.mustHave?.length) { addHeading('Must Have', 2); addList(mvp.mustHave); }
    if (mvp.shouldHave?.length) { addHeading('Should Have', 2); addList(mvp.shouldHave); }
    if (mvp.couldHave?.length) { addHeading('Could Have', 2); addList(mvp.couldHave); }
    if (mvp.excludedFeatures?.length) { addHeading("Won't Have (v1)", 2); addList(mvp.excludedFeatures); }
  }

  const roadmap = artifactMap['roadmap'] as any;
  if (roadmap) {
    addHeading('Product Roadmap', 1);
    if (roadmap.phase1?.length) { addHeading('Phase 1: Core MVP', 2); addList(roadmap.phase1); }
    if (roadmap.phase2?.length) { addHeading('Phase 2: Validation', 2); addList(roadmap.phase2); }
    if (roadmap.phase3?.length) { addHeading('Phase 3: Growth', 2); addList(roadmap.phase3); }
  }

  const health = artifactMap['health_score'] as any;
  if (health) {
    addHeading('Health Score', 1);
    addBody(`Score: ${health.score}/100`);
    if (health.strengths?.length) { addHeading('Strengths', 2); addList(health.strengths); }
    if (health.risks?.length) { addHeading('Risks', 2); addList(health.risks); }
    if (health.recommendations?.length) { addHeading('Recommendations', 2); addList(health.recommendations); }
  }

  const doc = new Document({
    title: project.name,
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const storageClient = await createServerSupabaseClient();
  const fileName = safeFileName(project.name, 'docx');
  const storagePath = `${user.id}/${projectId}/${fileName}`;

  const { data: uploadData, error: uploadError } = await storageClient.storage
    .from('exports')
    .upload(storagePath, Buffer.from(buffer), {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: true,
    });

  if (uploadError) {
    console.error('[export/docx] Storage upload failed:', uploadError.message);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to save export file.' } },
      { status: 500 }
    );
  }

  if (uploadData) {
    await createExportRecord(projectId, 'docx', uploadData.path);
  }

  return new Response(Buffer.from(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
