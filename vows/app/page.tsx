import { getAllTheaters, type TheaterMapData } from "@/lib/theaters";
import TheaterMap from "./components/theater-map";

export default async function Home() {
  let theaters: TheaterMapData[] = [];
  let hasError = false;

  try {
    theaters = await getAllTheaters();
  } catch {
    hasError = true;
  }

  return (
    <div className="mx-auto my-5 h-[480px] w-[98%] bg-amber-100">
      {hasError && <p>Unable to load theaters.</p>}
      {!hasError && theaters.length === 0 && (
        <p>No theaters with valid coordinates were found.</p>
      )}
      {theaters.length > 0 && <TheaterMap theaters={theaters} />}
    </div>
  );
}
