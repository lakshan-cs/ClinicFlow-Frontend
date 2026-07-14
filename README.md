# ClinicFlow Frontend

ClinicFlow is a Next.js frontend for a patient intake and appointment booking workflow.

The current intake flow is split into four steps:

1. Register patient
2. Record symptoms
3. Select a doctor
4. Book appointment

## Stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Mantine for UI components, modal state, and notifications
- React Hook Form for form state management
- Zod for validation schemas
- Axios for API requests
- Tailwind CSS 4 for utility styling

## Forms And Validation

Forms in this project use `react-hook-form` with `zodResolver`.

- Form state and submission: `react-hook-form`
- Validation schemas: `zod`
- Form-to-schema integration: `@hookform/resolvers/zod`
- UI inputs: Mantine components such as `TextInput`, `PasswordInput`, `Textarea`, `Autocomplete`, and `Checkbox`

Validation is kept separate from UI in the `schemas/` folder:

- `schemas/auth.ts`
- `schemas/patient.ts`
- `schemas/intake.ts`

## Project Structure

```text
app/
	(auth)/
		login/
	(protected)/
		dashboard/
		intake/
			register-patient/
			record-symptoms/
			select-doctor/
			book-appointment/

components/
	intake/
		IntakeStepper.tsx
		PatientSummary.tsx
		PatientRegistrationForm.tsx
		SymptomsForm.tsx
		DoctorCard.tsx
		AppointmentSlotPicker.tsx

schemas/
	auth.ts
	patient.ts
	intake.ts

services/
	authService.ts
	patientService.ts
	patientIntakeService.ts
	providerService.ts
	appointmentService.ts

types/
	auth.ts
	patient.ts
	patientIntake.ts
	provider.ts
	appointment.ts
	intake.ts
	intakeFlow.ts

utils/
	intakeFlowStorage.ts
```

## Intake Flow Routing

The intake flow was simplified so later steps do not carry long query strings.

- Step 2 routes to step 3 with `intakeId` only
- Step 3 routes to step 4 with `intakeId` only
- Shared flow state is stored in `sessionStorage` through `utils/intakeFlowStorage.ts`

The stored intake flow state includes values such as:

- `patientId`
- `chiefComplaint`
- `symptoms`
- selected doctor details

This keeps URLs shorter and prevents step pages from depending on large serialized query parameters.

## Shared UI Components

Reusable intake UI lives under `components/intake/`.

- `IntakeStepper` renders the four-step progress UI
- `PatientSummary` renders the left sidebar patient summary
- `PatientRegistrationForm` renders the step 1 form
- `SymptomsForm` renders the step 2 form
- `DoctorCard` renders a provider selection card
- `AppointmentSlotPicker` renders available and booked appointment slots

## API Configuration

The frontend reads the backend base URL from `NEXT_PUBLIC_API_URL`.

If it is not set, the services fall back to `http://localhost:5064` or `http://localhost:5064/api`, depending on the service.

## Available Scripts

Run the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Run linting:

```bash
npm run lint
```

## Notes

- Mantine is used for forms, cards, layout primitives, badges, stepper UI, modal dialogs, and notifications.
- TypeScript interfaces are centralized in the `types/` folder.
- Validation schemas are centralized in the `schemas/` folder.
- Intake flow state between steps 2 to 4 is centralized in `utils/intakeFlowStorage.ts`.
