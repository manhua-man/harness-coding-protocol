---
name: pipeline-quality-audit
description: >-
  Audit and improve media or AI-generation pipelines whose command may succeed
  while the delivered output is unusable. Use direct output evidence, attempt
  automatic repair/retry/fallback, quarantine bad attempts for diagnosis, and
  stop only when no valid deliverable can be produced.
---

# Pipeline Quality Audit

Judge the delivered media, not the command exit code. Prefer a recovery-first pipeline that returns a usable artifact and an observable account of repairs over one that rejects recoverable inputs and sends operational work back to the user.

## Outcome contract

Define the minimum usable result from project evidence before changing the pipeline:

- media type, dimensions/aspect ratio, duration, frame rate, and required streams;
- content requirements such as a visible subject, intentional motion, continuity, or style anchors;
- consumer path that must be able to open or retrieve the artifact;
- acceptable automatic repairs, retries, fallbacks, and quality degradation.

Do not invent requirements that the caller or product does not have. A static shot, dark frame, missing audio track, or unusual aspect ratio is not a defect unless it violates the actual contract.

## Recovery-first workflow

Use this order:

```text
detect
  -> normalize or repair locally
  -> retry the failed stage with bounded changed inputs
  -> use a declared fallback or lower-cost profile
  -> quarantine the unusable attempt and retain diagnostics
  -> terminal non-delivery only when no valid artifact can be produced
```

For every automatic action, record the attempt, observed defect, repair/fallback chosen, resulting artifact, and final consumer probe. Do not report a repaired failure as a clean first-attempt success.

### 1. Detect from actual output

- Probe the produced file with stable tools such as `ffprobe`, decoder reads, or image statistics.
- Black-frame detection may use ffmpeg `blackdetect`: `pix_th` is the darkness threshold and `pic_th` is the proportion of dark pixels. Treat thresholds as project-calibrated signals, not universal truth.
- Motion or duplicate-frame checks must exempt intentionally static content.
- Validate the final delivery contract, not only an intermediate render.
- Use numeric metrics to locate suspicious segments; use the product contract or visual review to decide whether the content is acceptable.

### 2. Repair and retry

- Normalize containers, codecs, dimensions, frame rate, duration, color metadata, or missing optional streams when a deterministic transform can recover the artifact.
- For generation failures, make one bounded input change at a time: clarify the subject/action/camera instruction, replace an invalid enum, use a compatible aspect ratio, or select a supported asset slot.
- Retry only when the changed input addresses the observed defect. Stop repeating an identical request.
- Preserve the first unusable attempt long enough to compare the repaired result; quarantine rather than overwrite it when diagnostic value remains.

### 3. Fallback

- Prefer declared pipeline capabilities: alternate model/profile, smaller resolution, fewer expensive post-processing stages, deterministic placeholder/asset, or a partial deliverable the consumer explicitly accepts.
- Use real project assets as anchors when they improve identity or continuity; do not synthesize assets when an existing canonical asset is available.
- Do not silently cross a product boundary. If a fallback changes the promised media type or removes a required feature, surface that as non-delivery.

### 4. Terminal non-delivery

Terminate only after the applicable repair, retry, and fallback paths are exhausted or the remaining choice requires user intent. Return:

- the first real defect and its direct evidence;
- repairs/retries/fallbacks attempted;
- the quarantined artifact or diagnostic location;
- the smallest missing input or external-state change needed to continue.

Do not generalize hard rejection, `raise first`, or preflight refusal as quality principles. Exceptions remain appropriate for unrecoverable programming errors or explicit caller contracts, but ordinary bad media should flow through recovery before becoming user work.

## Prompt, asset, and model diagnosis

After output recovery works, improve the source of recurring defects:

1. **Prompt** — replace abstract or timeline-only prose with visible subjects, physical actions, camera movement, amplitude/speed, and a stable ending frame when those concepts fit the model.
2. **Assets** — choose reference images by shot need and actual slot capacity; validate enum values and workflow inputs before spending generation time.
3. **Continuity** — keep aspect ratio, dimensions, duration grid, and true first-frame handoff consistent when cross-shot continuity is required. Verify handoff from pixels or decoder output rather than configuration alone.
4. **Model/profile** — use a higher-cost model, more steps, or tuning only after prompt, asset, and workflow defects are ruled out.

## Long-running jobs and observability

- Measure one representative sample before launching a batch; set timeouts from observed duration with bounded margin.
- Track owned child processes by direct handle or PID plus process start time. Never kill every process sharing an executable name.
- Expose current stage, attempt, elapsed time, selected fallback, and latest useful error. A watchdog must not create duplicate work when state is ambiguous.
- Cancellation stops claiming new work, lets the current small unit finish or roll back, and leaves the next run able to resume or clean abandoned scratch.

## Verification

Use focused examples that prove decisions, not wording:

- a known unusable artifact is detected and automatically repaired, retried, or replaced by an allowed fallback;
- a valid dark or static artifact is not rejected by generic thresholds;
- an invalid workflow enum is corrected before the expensive stage;
- cancellation and retry do not duplicate delivered artifacts;
- the final artifact can be opened through the intended consumer path;
- when recovery is impossible, the result is explicit non-delivery with retained diagnostics rather than a false success.

Keep project-specific thresholds, paths, model names, incident dates, and pipeline topology in the target repository, not in this generic skill.
