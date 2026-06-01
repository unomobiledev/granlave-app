import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useTrucksStore } from "@/store/trucks";
import { Button } from "@/components/ui/button";

export function NewTruckDialog() {
  const createDraftTruck = useTrucksStore((s) => s.createDraftTruck);
  const navigate = useNavigate();

  const handleClick = () => {
    const id = createDraftTruck();
    navigate({ to: "/etapa/$stageId/$truckId", params: { stageId: "1", truckId: id } });
  };

  return (
    <Button className="gap-2" onClick={handleClick}>
      <Plus className="h-4 w-4" /> Novo caminhão
    </Button>
  );
}