type SectionBandProps = {
  index: string;
  title: string;
  titleId: string;
  meta?: string;
};

export function SectionBand({ index, title, titleId, meta }: SectionBandProps) {
  return (
    <div className="band">
      <div className="w">
        <span className="tile">{index}</span>
        <h2 id={titleId}>{title}</h2>
        <span className="r">{meta}</span>
      </div>
    </div>
  );
}
