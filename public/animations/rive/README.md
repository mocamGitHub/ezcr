# Rive Animations

This directory contains interactive Rive animation files (.riv).

## Where to Download Rive Animations

### Free Community Animations

1. **Add to Cart Button**
   - Source: https://rive.app/community/files/8359-16034-download-button-animation/
   - File name: `add-to-cart-button.riv`
   - Features: Hover, click, and success states

2. **Shopping Cart Icon**
   - Source: https://flare.rive.app/a/sophanna/files/flare/cart-animation
   - File name: `cart-icon.riv`
   - Features: Animated cart with add item interaction

3. **E-commerce Illustrations**
   - Source: https://rive.app/community/files/1606-3151-animated-e-commerce-illustrations/
   - File name: `ecommerce-illustrations.riv`
   - Features: Various product and shopping animations

4. **Hover Button Animation**
   - Source: https://rive.app/community/files/6889-13245-hover-button-animation/
   - File name: `hover-button.riv`
   - Features: Galaxy-style hover effect

## How to Download

1. Visit the Rive community link
2. Click "Download" or "Get a copy" button
3. Save the .riv file to this directory
4. Update the import path in the React components

## How to Use

```tsx
import { useRive } from '@rive-app/react-canvas'

function MyComponent() {
  const { RiveComponent } = useRive({
    src: '/animations/rive/add-to-cart-button.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  })

  return <RiveComponent />
}
```

## Interactive Features

Rive animations support:
- **State Machines**: Multiple animation states (idle, hover, click, success)
- **Inputs**: Boolean, number, and trigger inputs
- **Events**: Respond to user interactions
- **Real-time Control**: Programmatic animation control

## License

Check each animation's license on the Rive community page before use.
Most community files are free for personal and commercial use, but always verify.
