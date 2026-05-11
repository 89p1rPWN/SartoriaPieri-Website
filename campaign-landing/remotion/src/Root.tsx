import { Composition } from "remotion";
import { CardBurn, CARD_BURN_DURATION, CARD_BURN_FPS, CARD_BURN_SIZE } from "./CardBurn";
import { CardBurnRemix, REMIX_DURATION, REMIX_FPS, REMIX_SIZE } from "./CardBurnRemix";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CardBurn"
        component={CardBurn}
        durationInFrames={CARD_BURN_DURATION}
        fps={CARD_BURN_FPS}
        width={CARD_BURN_SIZE}
        height={CARD_BURN_SIZE}
      />
      <Composition
        id="CardBurnRemix"
        component={CardBurnRemix}
        durationInFrames={REMIX_DURATION}
        fps={REMIX_FPS}
        width={REMIX_SIZE}
        height={REMIX_SIZE}
      />
    </>
  );
};
