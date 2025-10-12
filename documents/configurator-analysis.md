# EZ Cycle Ramp Configurator - Complete Technical Analysis

## Executive Summary
This document provides a comprehensive breakdown of the EZ Cycle Ramp configurator HTML file to enable accurate rebuilding in Next.js with React and TypeScript. All design specifications, business logic, validation rules, and data structures are documented below.

---

## 1. Steps Structure

### Step 1: Vehicle Type Selection
**Purpose**: Collect vehicle type and optional contact information

**Fields**:
- **Contact Information (Optional)**:
  - First Name (text input)
  - Last Name (text input)
  - Email Address (email input)
  - Phone Number (tel input)
  - SMS Opt-in (checkbox with disclosure text)

- **Vehicle Selection (Required)**:
  - Pickup Truck (with tailgate)
  - Cargo Van (Sprinter, Transit, etc.)
  - Trailer (Enclosed or open)

**Navigation**:
- Previous: Disabled
- Next: Disabled until vehicle is selected

---

### Step 2: Measurements
**Purpose**: Collect vehicle-specific measurements

**Fields vary by vehicle type**:

**For Pickup Truck**:
- Cargo Area (closed tailgate) - in inches or cm
  - Min: 53.149 inches (135.00 cm)
  - Max: 98.426 inches (250.00 cm)
- Total Length (open tailgate) - in inches or cm
  - Min: 68 inches (172.72 cm)
  - Max: 98.426 inches (250.00 cm)
- Height from Ground - in inches or cm
  - Max: 60 inches (152.40 cm)

**For Van/Trailer**:
- Cargo Area Length - in inches or cm
  - Min: 53.149 inches (135.00 cm)
  - Max: 98.426 inches (250.00 cm)
- Height from Ground - in inches or cm
  - Max: 60 inches (152.40 cm)

**Visual Guide**: Pickup trucks show 3 measurement diagram cards

**Validation Warnings**:
- Height warning: Displays when height >= 35 inches, shows required AC001 extension
- Cargo warning: Displays when cargo area > 80 inches

---

### Step 3: Motorcycle Information
**Purpose**: Collect motorcycle specifications

**Fields**:
- **Motorcycle Type (Required)** - Card selection:
  - Sport Bike (CBR, R1, GSX-R)
  - Cruiser (Harley, Indian)
  - Adventure (GS, Africa Twin)

- **Motorcycle Details (All Required)**:
  - Weight (lbs or kg)
  - Wheelbase (inches or cm)
  - Total Length (inches or cm)

**Validation**:
- Error banner shown if motorcycle type not selected
- Individual field validation for all numeric inputs

---

### Step 4: Configuration & Recommendation
**Purpose**: Display recommendations and allow customization

**Sections**:

1. **Configuration Summary** (Read-only display):
   - Vehicle Type
   - Cargo Area
   - Total Length
   - Load Height
   - Motorcycle Type
   - Motorcycle Weight
   - Wheelbase
   - Total Length (motorcycle)

2. **Ramp Model Selection** (Single choice):
   - AUN250 - $1,299 (RECOMMENDED, selected by default)
     - 2,500 lb weight capacity
     - 8ft overall length
     - Ideal for pickup trucks
     - Non-slip surface
   - AUN210 - $999
     - 2,000 lb weight capacity
     - 7ft overall length
     - Lightweight design
     - Budget-friendly option

3. **Ramp Extensions** (Single choice):
   - No Extension - $0
   - Extension 1 - $149 (RECOMMENDED, selected by default, 12" extension)
   - Extension 2 - $249 (24" extension)
   - Extension 3 - $349 (36" extension)

4. **Delivery Options** (Single choice):
   - Pickup - $0
   - Ship - $185

5. **Services** (Single choice):
   - Not Assembled - $0
   - Assembly Service - $99
   - Demo (includes assembly) - $149

6. **Boltless Tiedown Kit** (Single choice):
   - No Boltless Tiedown Kit - $0
   - Boltless Tiedown Kit - $89

7. **Tie-Down Accessories** (Single choice):
   - No Tiedown Accessory - $0
   - Turnbuckles (1 pair) - $89
   - Turnbuckles (2 pairs) - $159
   - Tiedown Straps - $29

---

### Step 5: Quote Summary
**Purpose**: Display complete quote with pricing breakdown

**Sections**:

1. **Customer Information**:
   - Name (from step 1 or "Not provided")
   - Email (from step 1 or "Not provided")
   - Phone (from step 1 or "Not provided")
   - Shipping Address ("To be provided")

2. **Vehicle & Motorcycle Details**:
   - All data from steps 1-3 displayed

3. **Selected Configuration**:
   - List of all selected items with prices

4. **Quote Summary Box**:
   - Line items for each selected product
   - Subtotal
   - Sales Tax (8.9%)
   - Credit Card Processing (3%)
   - Total

**Actions**:
- Add to Cart (orange button)
- Call for Consultation (outlined button with phone: 800-687-4410)
- Email Quote (utility button)
- Print Quote (utility button)

**Contact Modal**: Triggered if contact info missing when clicking quote actions

---

## 2. Business Rules

### Extension Selection Logic

**AC001 Extensions (Height-based - Auto-determined)**:
- Height 35-42 inches → AC001-1 Extension (required)
- Height 43-51 inches → AC001-2 Extension (required)
- Height 52-60 inches → AC001-3 Extension (required)
- Height < 35 inches → No AC001 extension needed

**Cargo Extensions (Cargo length-based)**:
- Cargo area > 80 inches → Special extension required (automatically included based on ramp model)

### Ramp Model Recommendation Logic
- AUN250 is marked as RECOMMENDED by default
- Selection is manual; no automatic switching based on measurements

### Service and Delivery Compatibility
**Rule**: Demo service is incompatible with Ship delivery
- If Demo is selected → Ship option is blocked with warning message
- If Ship is selected and user tries Demo → Alert shown, auto-switches to Pickup
- Warning message: "⚠️ Shipping is not available with Demo service. Please select Not Assembled or Assembly Service."

### Boltless Kit and Turnbuckles Logic
- If Boltless Tiedown Kit ($89) is selected → Turnbuckles (2 pairs) becomes RECOMMENDED
- Auto-selects Turnbuckles (2 pairs) when Boltless Kit is selected
- Removes RECOMMENDED badge from Turnbuckles (2 pairs) when Boltless Kit is deselected

---

## 3. Data Flow

### Data Structure (configData object)
```javascript
{
  vehicle: 'pickup' | 'van' | 'trailer' | null,
  contact: {
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    smsOptIn: boolean
  },
  measurements: {
    bedLengthClosed?: number,      // For pickup only
    bedLengthOpen?: number,         // For pickup only
    cargoLength?: number,           // For van/trailer
    loadHeight: number,
    requiredAC001?: 'AC001-1' | 'AC001-2' | 'AC001-3' | null,
    requiresCargoExtension?: boolean
  },
  motorcycle: {
    type: 'sport' | 'cruiser' | 'adventure' | null,
    weight: number,
    wheelbase: number,
    length: number
  },
  selectedModel: {
    name: string,
    price: number
  },
  extension: {
    name: string,
    price: number
  },
  boltlessKit: {
    name: string,
    price: number
  },
  tiedown: {
    name: string,
    price: number
  },
  service: {
    name: string,
    price: number
  },
  delivery: {
    name: string,
    price: number
  }
}
```

### Data Persistence Points
- Data is saved when:
  - Moving to next step (saveStepData() called)
  - Moving to previous step (saveStepData() called)
  - Clicking on step progress indicator (saveStepData() called)
  - Changing units (saveStepData() called before conversion)

### Unit Conversion
**Conversion Factors**:
- Length: 2.54 (inches to cm)
- Weight: 0.453592 (lbs to kg)

**Conversion Flow**:
1. Save current form values
2. Convert stored configData values
3. Update unit labels
4. Populate form with converted values

---

## 4. Validation Rules

### Step 1 Validation
- Vehicle selection is required to enable "Continue" button
- Contact fields are optional (no validation)

### Step 2 Validation

**Pickup Truck**:
- Cargo Area (closed): Required, 53.149-98.426 inches
- Total Length (open): Required, 68-98.426 inches
- Height: Required, max 60 inches

**Van/Trailer**:
- Cargo Area: Required, 53.149-98.426 inches
- Height: Required, max 60 inches

**Error Messages**:
- "Please enter a valid cargo area ({min}-{max} {unit})"
- "Please enter a valid total length ({min}-{max} {unit})"
- "Please enter a valid height (max: {max} {unit})"

**Validation Behavior**:
- Converts input to inches for validation (if metric)
- Shows red border, red error text below field
- Alert popup with all validation errors
- Prevents navigation until all fields valid

### Step 3 Validation
- Motorcycle type: Required (error banner if missing)
- Weight: Required
- Wheelbase: Required
- Total Length: Required

**Error Messages**:
- "Please select a motorcycle type to continue"
- "Please enter the motorcycle weight"
- "Please enter the wheelbase measurement"
- "Please enter the total length"

### Step 5 Validation (Contact Modal)
**Triggered when**: User clicks Add to Cart, Email Quote, or Print Quote without contact info

**Required Fields**:
- First Name
- Last Name
- Email Address
- Phone Number (optional in modal)

---

## 5. UI Components

### Cards
**Vehicle Cards** (Step 1 & 3):
- Structure: Icon (emoji) + Name + Description
- States: default, hover (lift + shadow), selected (blue background)
- Grid: 3 columns

**Model Cards** (Step 4):
- Structure: Header (name + price) + Description + Feature list
- Badge: "RECOMMENDED" (green, absolute positioned)
- States: default, selected (orange border + orange tint), recommended.not-selected (grey badge)
- Grid: Auto-fit, min 300px

**Accessory Cards** (Step 4):
- Structure: Header (name + price) + Description
- Badge: "RECOMMENDED" (green)
- States: default, selected (orange border + orange tint), recommended.not-selected (grey badge)
- Grid: Auto-fit, min 250px (or 2-column for specific sections)

### Buttons

**Primary Button**:
- Blue background (#4a9eda)
- White text, rounded (30px)
- Hover: Darker blue, lift (-2px)

**Secondary Button**:
- Transparent background
- Border, muted text
- Hover: Tertiary background

**Config Button** (Step 5):
- Green background (#10b981)
- White text

**Add to Cart Button**:
- Orange background (#f97316)
- Large, prominent

**Consultation Button**:
- Orange border, orange text
- Transparent background
- Contains phone number

**Utility Buttons**:
- Small, tertiary background
- Icon + text

### Inputs
- Padding: 0.85rem 1.2rem
- Border radius: 10px
- Focus: Blue border + blue shadow
- Error: Red border (2px) + red shadow + red tint
- Placeholder: Italic, muted, low opacity (0.5)

### Progress Bar
- Container: Secondary background, rounded (20px)
- Steps: Flex, space-between
- Line: Horizontal, grey, 2px, animated fill (blue)
- Circles: 40px, numbered
- States:
  - Default: Grey background
  - Current: Blue, scaled (1.3), large shadow, pulsing
  - Completed: Green, checkmark icon
  - Disabled: Opacity 0.6, no pointer
- Labels: Below circles
  - Current: Blue, bold, underlined
  - Completed: Dark, medium weight

### Warning Banners
- Background: Orange tint (rgba(249, 115, 22, 0.1))
- Border: 1px solid orange
- Orange text
- Icon: ℹ️ or ⚠️
- Conditionally shown/hidden

### Modal
- Backdrop: Black, 0.8 opacity
- Content: Secondary background, rounded (15px), max-width 500px
- Centered vertically and horizontally
- Scrollable if content exceeds 90vh

---

## 6. Color Scheme

### Primary Colors
```css
--primary: #4a9eda           /* Primary blue */
--primary-dark: #3a7eb8      /* Darker blue for hover */
--primary-light: #6bb3e8     /* Lighter blue */
--secondary: #f97316         /* Orange (accent) */
--secondary-dark: #ea580c    /* Darker orange for hover */
--success: #10b981           /* Green (success/completed) */
--success-dark: #059669      /* Darker green for hover */
```

### Neutral Colors
```css
--dark: #0a0a0a
--dark-secondary: #1a1a1a
--light: #f8fafc
--text-light: #94a3b8
--gold: #d4af37
--border: #2a2a2a
--error: #ef4444
```

### Theme-Specific Colors

**Light Theme**:
```css
--bg-primary: #ffffff
--bg-secondary: #fafafa
--bg-tertiary: #f5f5f5
--text-primary: #0a0a0a
--text-secondary: #404040
--text-muted: #606060
--card-bg: #ffffff
--border-color: #e0e0e0
--shadow: rgba(0, 0, 0, 0.08)
```

**Dark Theme** (Default):
```css
--bg-primary: #0a0a0a
--bg-secondary: #111111
--bg-tertiary: #1a1a1a
--text-primary: #ffffff
--text-secondary: #e0e0e0
--text-muted: #a0a0a0
--card-bg: #141414
--border-color: #2a2a2a
--shadow: rgba(0, 0, 0, 0.9)
```

### Logo Colors
```css
EZ CYCLE: #005696 (blue)
RAMP: #ff8c00 (orange)
```

---

## 7. Pricing Structure

### Ramp Models
- **AUN250**: $1,299.00
- **AUN210**: $999.00

### Extensions
- **No Extension**: $0.00
- **Extension 1** (12"): $149.00
- **Extension 2** (24"): $249.00
- **Extension 3** (36"): $349.00

### Delivery
- **Pickup**: $0.00
- **Ship**: $185.00

### Services
- **Not Assembled**: $0.00
- **Assembly Service**: $99.00
- **Demo (includes assembly)**: $149.00

### Boltless Tiedown Kit
- **No Boltless Tiedown Kit**: $0.00
- **Boltless Tiedown Kit**: $89.00

### Tie-Down Accessories
- **No Tiedown Accessory**: $0.00
- **Turnbuckles (1 pair)**: $89.00
- **Turnbuckles (2 pairs)**: $159.00
- **Tiedown Straps**: $29.00

### Tax & Fees
- **Sales Tax**: 8.9% of subtotal
- **Credit Card Processing**: 3% of subtotal

### Price Calculation
```
Subtotal = Model + Extension + BoltlessKit + Tiedown + Service + Delivery
Tax = Subtotal × 0.089
Processing Fee = Subtotal × 0.03
Total = Subtotal + Tax + Processing Fee
```

---

## 8. JavaScript Functions

### Navigation Functions

**`goToStep(step)`**
- Validates if step is accessible (completed previous steps)
- Saves current step data
- Updates visual indicators (current, completed states)
- Shows/hides step panels
- Updates progress bar fill
- Calls updateMeasurementForm() for step 2
- Calls updateConfigSummary() for step 4
- Calls updateQuoteSummary() for step 5

**`nextStep()`**
- Saves current step data
- Marks current step as completed
- Updates step circle to checkmark
- Enables next step
- Increments currentStep
- Updates progress bar
- Calls appropriate update functions

**`previousStep()`**
- Saves current step data
- Decrements currentStep
- Does NOT remove completed state
- Updates progress bar

**`validateAndNextStep(step)`**
- For Step 2: Validates all measurements against ranges
- For Step 3: Validates motorcycle type and all fields
- Shows error messages for invalid fields
- Calls nextStep() if valid

### Selection Functions

**`selectVehicle(element, type)`**
- Removes 'selected' class from all vehicle cards
- Adds 'selected' to clicked card
- Stores vehicle type in configData
- Enables next button

**`selectBikeType(element, type)`**
- Removes 'selected' from all bike type cards
- Adds 'selected' to clicked card
- Stores motorcycle type in configData
- Hides error banner

**`selectModel(element, model, price)`**
- Removes 'selected' from all model cards
- Handles recommended badge states (not-selected)
- Adds 'selected' to clicked card
- Updates configData.selectedModel

**`selectAccessory(element, id, price)`**
- Handles extension selections
- Updates configData.extension

**`selectBoltlessKit(element, id, price)`**
- Updates configData.boltlessKit
- If 'kit' selected: Makes Turnbuckles (2 pairs) RECOMMENDED and auto-selects it
- If 'no-kit' selected: Removes RECOMMENDED from Turnbuckles (2 pairs)

**`selectTiedown(element, id, price)`**
- Updates configData.tiedown
- Handles conditional recommendation for Turnbuckles (2 pairs)

**`selectService(element, id, price)`**
- Updates configData.service
- If 'demo' selected: Shows delivery warning, auto-switches to Pickup if Ship selected
- If other service: Hides delivery warning

**`selectDelivery(element, id, price)`**
- Validates compatibility with service (blocks Ship + Demo)
- Shows alert if incompatible
- Updates configData.delivery
- Hides warning if Pickup selected

### Validation Functions

**`validateMeasurement(input, minInches, maxInches, type)`**
- Converts value to inches for validation
- Checks against min/max ranges
- Shows/hides error messages
- For cargo type > 80": Shows cargo warning

**`validateHeight(input)`**
- Converts value to inches
- Validates max 60 inches
- Determines required AC001 extension:
  - 35-42" → AC001-1
  - 43-51" → AC001-2
  - 52-60" → AC001-3
- Shows/hides height warning with extension name
- Stores requiredAC001 in configData

### Data Management Functions

**`saveStepData()`**
- Step 1: Saves contact information
- Step 2: Saves measurements (different fields for pickup vs van/trailer)
- Step 3: Saves motorcycle information

**`updateMeasurementForm()`**
- Dynamically generates measurement inputs based on vehicle type
- Shows/hides measurement guide
- Populates fields with stored values
- Adjusts labels and placeholders for current units

**`updateConfigSummary()`**
- Populates Step 4 summary section
- Formats measurements with current units
- Displays all configuration data

**`updateQuoteSummary()`**
- Populates Step 5 quote details
- Builds configuration item list HTML
- Builds price breakdown HTML
- Calculates subtotal, tax, processing fee, total
- Updates all display elements

### Unit Conversion Functions

**`setUnit(unit, event)`**
- Saves current form data
- Converts all stored measurements and weights
- Updates unit labels
- Repopulates current form with converted values

**`updateUnitLabels()`**
- Updates all (lbs) / (kg) labels
- Updates all (inches) / (cm) labels

### Modal & Action Functions

**`addToCart()`**
- Checks for contact info
- Shows modal if missing
- Sets pendingAction = 'cart'
- Calls proceedToCart() if info exists

**`emailQuote()`**
- Checks for contact info
- Shows modal if missing
- Sets pendingAction = 'email'
- Shows alert with email address

**`printQuote()`**
- Checks for contact info
- Shows modal if missing
- Sets pendingAction = 'print'
- Calls window.print()

**`proceedToCart()`**
- Shows success alert
- Integration point for cart system

**`closeModal()`**
- Removes 'active' class from modal
- Clears pendingAction

**`saveContactAndProceed()`**
- Validates required fields (firstName, lastName, email)
- Saves contact info to configData
- Closes modal
- Executes pendingAction (email, print, or cart)

### Theme Functions

**`toggleTheme()`**
- Toggles between 'dark' and 'light'
- Updates theme icon and text
- Saves preference to localStorage

### Initialization

**DOMContentLoaded Event**:
- Loads saved theme from localStorage
- Sets up input event listeners to clear errors on typing

---

## 9. Measurement Ranges & Validation Messages

### Cargo/Bed Length
- **Min**: 53.149 inches (135.00 cm)
- **Max**: 98.426 inches (250.00 cm)
- **Message**: "Please enter a valid cargo area ({min}-{max} {unit})"
- **Special Rule**: If > 80 inches, cargo extension required

### Total Length (Pickup with open tailgate)
- **Min**: 68 inches (172.72 cm)
- **Max**: 98.426 inches (250.00 cm)
- **Message**: "Please enter a valid total length ({min}-{max} {unit})"

### Load Height
- **Max**: 60 inches (152.40 cm)
- **Message**: "Please enter a valid height (max: {max} {unit})"
- **Extension Logic**:
  - 35-42": AC001-1 Extension required
  - 43-51": AC001-2 Extension required
  - 52-60": AC001-3 Extension required
  - < 35": No extension required

### Out of Range Guidance
"Have a special situation or measurements outside these ranges? Call us at **800-687-4410** to discuss."

---

## 10. State Management

### Global State Variables
```javascript
let currentStep = 1;                    // Current step number (1-5)
let completedSteps = [];                // Array of completed step numbers
let units = 'imperial';                 // 'imperial' or 'metric'
let pendingAction = null;               // 'cart', 'email', or 'print'
let configData = { /* see section 3 */ };
```

### Step Progress States
- **disabled**: Step not yet accessible (grey, opacity 0.6)
- **current**: Currently active step (blue, scaled, pulsing)
- **completed**: Step finished (green, checkmark)

### Card Selection States
- **default**: Not selected
- **selected**: Currently selected (blue or orange highlight)
- **recommended**: Has recommended badge (green)
- **recommended.not-selected**: Recommended but not selected (grey badge)

---

## 11. Responsive Breakpoints

### Desktop (Default)
- Max width: 1200px for config container
- Max width: 1400px for header nav

### Tablet (≤1024px)
- Vehicle grid: 2 columns (from 3)
- Quote container: 1 column (from 2 columns)
- Quote summary box: Static position (from sticky)
- Measurements row: 1 column
- Two-column accessories: 1 column
- Summary grid: 2 columns (from 4)

### Mobile (≤768px)
- Nav actions: Flex wrap
- Vehicle grid: 1 column
- Summary grid: 1 column
- Step content padding: 1.5rem (from 3rem)

---

## 12. Animations

### fadeIn (Step panels)
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
Duration: 0.3s ease
```

### slideDown (Error messages)
```css
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
Duration: 0.2s ease
```

### Progress bar fill
- Transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1)

### Hover effects
- Card lift: translateY(-5px)
- Button lift: translateY(-2px)
- Step circle scale: 1.1 on hover, 1.3 when current
- All transitions: 0.3s ease

---

## 13. Font & Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

### Font Smoothing
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Typography Scale
- **Step Title**: 2rem, weight 700
- **Step Description**: 1.15rem, line-height 1.6
- **Section Title**: 1.3rem, weight 600
- **Contact Title**: 1.2rem, weight 600
- **Model Name**: 1.3rem, weight 700
- **Model Price**: 1.5rem, weight 700
- **Accessory Name**: weight 600
- **Accessory Price**: weight 700
- **Form Label**: 0.95rem, weight 500
- **Form Input**: 1rem
- **Error Text**: 0.85rem, weight 600
- **Vehicle Icon**: 3.5rem

---

## 14. Accessibility Considerations

### Form Accessibility
- All inputs have associated labels
- Required fields marked with asterisk (*)
- Error messages use red color AND text
- Focus states have visible outlines (blue shadow)
- Placeholder text is descriptive

### Navigation
- Clear step progression
- Visual feedback for current/completed states
- Disabled states are clearly indicated
- Progress bar shows overall position

### Interactive Elements
- All clickable elements have hover states
- Cards have clear selected states
- Buttons have distinct visual hierarchy
- Links use descriptive text

### Keyboard Support
- Form inputs are keyboard accessible
- Buttons are keyboard accessible
- Standard tab order

---

## 15. Integration Points for Next.js Implementation

### Required Libraries
- React state management (useState, useContext)
- Form validation library (e.g., react-hook-form, Formik)
- Type definitions for all data structures
- Unit conversion utilities

### Component Hierarchy
```
App
├── Header
│   ├── Logo
│   ├── UnitToggle
│   ├── ThemeToggle
│   └── ExitButton
├── ConfiguratorContainer
│   ├── ProgressBar
│   │   └── ProgressStep[]
│   ├── StepContent
│   │   ├── Step1 (VehicleType)
│   │   │   ├── ContactForm
│   │   │   └── VehicleSelector
│   │   ├── Step2 (Measurements)
│   │   │   ├── MeasurementGuide
│   │   │   └── MeasurementForm
│   │   ├── Step3 (Motorcycle)
│   │   │   ├── BikeTypeSelector
│   │   │   └── BikeDetailsForm
│   │   ├── Step4 (Configuration)
│   │   │   ├── ConfigSummary
│   │   │   ├── ModelSelector
│   │   │   ├── ExtensionSelector
│   │   │   ├── DeliverySelector
│   │   │   ├── ServiceSelector
│   │   │   ├── BoltlessKitSelector
│   │   │   └── TiedownSelector
│   │   └── Step5 (Quote)
│   │       ├── QuoteDetails
│   │       └── QuoteSummary
│   └── Navigation
└── ContactModal
```

### API Endpoints Needed
- POST /api/configurator/save - Save configuration
- POST /api/configurator/quote - Generate quote
- POST /api/cart/add - Add to cart
- POST /api/email/quote - Email quote
- GET /api/configurator/load - Load saved configuration

### LocalStorage Keys
- `theme` - 'dark' or 'light'
- `configuratorData` - Full configData object (optional)
- `configuratorProgress` - currentStep and completedSteps

---

## 16. Key Implementation Notes

### Critical Business Logic
1. **AC001 Extension Determination** is height-based and automatic
2. **Cargo Extension** requirement is based on cargo length > 80"
3. **Demo + Ship incompatibility** must be enforced
4. **Boltless Kit + Turnbuckles (2 pairs)** auto-recommendation
5. **Unit conversion** must maintain precision and round appropriately
6. **Validation** must convert to inches before checking ranges
7. **Progress bar** allows clicking to jump to completed steps only

### Default Selections
- Theme: Dark mode
- Units: Imperial
- Ramp Model: AUN250 ($1,299) - RECOMMENDED
- Extension: Extension 1 ($149) - RECOMMENDED
- All other selections: None (user must choose)

### Phone Number
Support/Consultation: **800-687-4410**

### Exit URL
Exit Configurator button links to: `/`

### Support URL
Need Help? link: `/support` (opens in new tab)

---

## 17. Testing Checklist

### Functional Testing
- [ ] All 5 steps navigate correctly
- [ ] Progress bar updates accurately
- [ ] All validations work correctly
- [ ] Unit conversion maintains data integrity
- [ ] Theme toggle persists on reload
- [ ] Contact modal triggers when needed
- [ ] Demo + Ship incompatibility enforced
- [ ] Boltless Kit auto-recommends Turnbuckles (2 pairs)
- [ ] AC001 extension logic accurate for all height ranges
- [ ] Cargo extension warning appears correctly
- [ ] Quote calculations are accurate
- [ ] All selection states visual feedback works

### Edge Cases
- [ ] Switching units mid-configuration
- [ ] Going back and changing selections
- [ ] Clicking progress steps out of order
- [ ] Validation with metric units
- [ ] Empty/missing contact info scenarios
- [ ] Measurements at exact boundary values
- [ ] Browser back button behavior
- [ ] Print functionality
- [ ] Modal cancel/close behavior

### Visual Testing
- [ ] Dark mode appears correct
- [ ] Light mode appears correct
- [ ] Responsive breakpoints work
- [ ] All hover states function
- [ ] All animations smooth
- [ ] Error states visible and clear
- [ ] Selected states clearly visible
- [ ] Recommended badges positioned correctly

---

## 18. Design Tokens for TypeScript

```typescript
// Colors
export const colors = {
  primary: '#4a9eda',
  primaryDark: '#3a7eb8',
  primaryLight: '#6bb3e8',
  secondary: '#f97316',
  secondaryDark: '#ea580c',
  success: '#10b981',
  successDark: '#059669',
  error: '#ef4444',
  dark: '#0a0a0a',
  darkSecondary: '#1a1a1a',
  light: '#f8fafc',
  textLight: '#94a3b8',
  gold: '#d4af37',
  border: '#2a2a2a',
  logoBlue: '#005696',
  logoOrange: '#ff8c00',
} as const;

// Measurement ranges (all in inches)
export const measurementRanges = {
  cargoMin: 53.149,
  cargoMax: 98.426,
  totalLengthMin: 68,
  totalLengthMax: 98.426,
  heightMax: 60,
  cargoExtensionThreshold: 80,
  ac001Ranges: {
    AC001_1: { min: 35, max: 42 },
    AC001_2: { min: 43, max: 51 },
    AC001_3: { min: 52, max: 60 },
  },
} as const;

// Conversion factors
export const conversionFactors = {
  inchesToCm: 2.54,
  lbsToKg: 0.453592,
} as const;

// Tax and fees
export const fees = {
  salesTaxRate: 0.089,
  processingFeeRate: 0.03,
} as const;

// Contact
export const contact = {
  phone: '800-687-4410',
  supportUrl: '/support',
  exitUrl: '/',
} as const;
```

---

This completes the comprehensive technical analysis of the EZ Cycle Ramp configurator. All specifications, logic, validation rules, and design details have been documented to enable accurate rebuilding in Next.js with React and TypeScript.
