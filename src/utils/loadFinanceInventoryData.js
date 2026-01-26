/**
 * Load all finance and inventory data files
 */
export async function loadFinanceInventoryData() {
    try {
        // First, get the meta.json to determine how many days we have
        const metaResponse = await fetch("/output/meta.json", {
            cache: "no-store",
            headers: { Accept: "application/json" },
        });

        if (!metaResponse.ok) {
            throw new Error("Failed to load meta.json");
        }

        const meta = await metaResponse.json();

        // Get total days from meta.json sheets
        // Try financial.days first, then inventory.days, then fallback to 50
        const totalDays =
            meta.sheets?.financial?.days ||
            meta.sheets?.inventory?.days ||
            meta.total_days ||
            50;

        console.log(`Loading ${totalDays} days of finance and inventory data...`);

        // Load all financial and inventory data
        const financePromises = [];
        const inventoryPromises = [];

        for (let day = 0; day < totalDays; day++) {
            const dayStr = String(day).padStart(3, "0");

            financePromises.push(
                fetch(`/output/financial/day_${dayStr}.json`, {
                    cache: "no-store",
                    headers: { Accept: "application/json" },
                }).then((res) => (res.ok ? res.json() : null))
            );

            inventoryPromises.push(
                fetch(`/output/inventory/day_${dayStr}.json`, {
                    cache: "no-store",
                    headers: { Accept: "application/json" },
                }).then((res) => (res.ok ? res.json() : null))
            );
        }

        const [financeData, inventoryData] = await Promise.all([
            Promise.all(financePromises),
            Promise.all(inventoryPromises),
        ]);

        // Filter out null values (failed fetches)
        const validFinanceData = financeData.filter((d) => d !== null);
        const validInventoryData = inventoryData.filter((d) => d !== null);

        console.log(`Successfully loaded ${validFinanceData.length} financial records and ${validInventoryData.length} inventory records`);

        return {
            finance: validFinanceData,
            inventory: validInventoryData,
            meta,
        };
    } catch (error) {
        console.error("Error loading finance/inventory data:", error);
        throw error;
    }
}
