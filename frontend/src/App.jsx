import { useState, useEffect } from "react";
import { getContract } from "./contract";

function App() {

  // =========================================================
  // WALLET / ROLE
  // =========================================================

  const [walletAddress, setWalletAddress] = useState("");
  const [role, setRole] = useState("");
  const [connected, setConnected] = useState(false);


  // =========================================================
  // REGISTER BATCH
  // =========================================================

  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");


  // =========================================================
  // FETCH BATCH
  // =========================================================

  const [batchId, setBatchId] = useState("");
  const [batch, setBatch] = useState(null);
  const [ownershipHistory, setOwnershipHistory] = useState([]);


  // =========================================================
  // TRANSFER
  // =========================================================

  const [transferId, setTransferId] = useState("");
  const [statusBatchId, setStatusBatchId] = useState("");

  const [loading, setLoading] = useState(false);


  // =========================================================
  // ADMIN — ASSIGN ROLE
  // =========================================================

  const [assignAddress, setAssignAddress] = useState("");
  const [assignRoleValue, setAssignRoleValue] = useState("2");
  const [assignLoading, setAssignLoading] = useState(false);


  // =========================================================
  // TEMPERATURE MONITORING
  // =========================================================

  // Manufacturer temperature range
  const [temperatureBatchId, setTemperatureBatchId] = useState("");
  const [minimumTemperature, setMinimumTemperature] = useState("");
  const [maximumTemperature, setMaximumTemperature] = useState("");
  const [temperatureLoading, setTemperatureLoading] = useState(false);

  // Transporter temperature reading
  const [readingBatchId, setReadingBatchId] = useState("");
  const [temperatureReading, setTemperatureReading] = useState("");
  const [readingLoading, setReadingLoading] = useState(false);

  // Temperature data for tracked batch
  const [temperatureRange, setTemperatureRange] = useState(null);
  const [temperatureHistory, setTemperatureHistory] = useState([]);


  // =========================================================
  // ROLE NAMES
  // =========================================================

  const roleNames = {
    0: "NONE",
    1: "ADMIN",
    2: "MANUFACTURER",
    3: "TRANSPORTER",
    4: "DISTRIBUTOR",
    5: "PHARMACY",
  };


  // =========================================================
  // METAMASK ACCOUNT / ROLE HANDLING
  // =========================================================

  const updateWalletState = async (accounts) => {

    if (!accounts || accounts.length === 0) {

      setWalletAddress("");
      setRole("");
      setConnected(false);

      return;
    }

    try {

      const contract = await getContract();

      if (!contract) {
        return;
      }

      const address = accounts[0];

      const roleValue =
        await contract.roles(address);

      const roleNumber =
        Number(roleValue);

      setWalletAddress(address);

      setRole(
        roleNames[roleNumber] || "UNKNOWN"
      );

      setConnected(true);

    } catch (err) {

      console.error(
        "Failed to update wallet state:",
        err
      );

    }
  };


  // =========================================================
  // AUTOMATIC METAMASK ACCOUNT SWITCH
  // =========================================================

  useEffect(() => {

    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged = async (
      accounts
    ) => {

      console.log(
        "MetaMask account changed:",
        accounts[0]
      );

      await updateWalletState(accounts);
    };


    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );


    // Check current account when page loads
    window.ethereum
      .request({
        method: "eth_accounts",
      })
      .then((accounts) => {

        if (
          accounts &&
          accounts.length > 0
        ) {
          updateWalletState(accounts);
        }

      })
      .catch((err) => {

        console.error(
          "Initial MetaMask account check failed:",
          err
        );

      });


    return () => {

      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

    };

  }, []);


  // =========================================================
  // CONNECT WALLET BUTTON
  // =========================================================

  const connectWallet = async () => {

    try {

      if (!window.ethereum) {

        alert(
          "Please install MetaMask."
        );

        return;
      }


      const accounts =
        await window.ethereum.request({
          method: "eth_requestAccounts",
        });


      if (
        !accounts ||
        accounts.length === 0
      ) {

        alert(
          "No MetaMask account selected."
        );

        return;
      }


      await updateWalletState(accounts);


    } catch (err) {

      console.error(
        "MetaMask connection failed:",
        err
      );

      alert(
        "Failed to connect MetaMask."
      );

    }
  };


  // =========================================================
  // REGISTER BATCH
  // =========================================================

  const registerBatch = async () => {

    try {

      setLoading(true);

      const contract =
        await getContract();

      if (!contract) {
        setLoading(false);
        return;
      }


      if (!productName.trim()) {

        alert(
          "Please enter product name"
        );

        return;
      }


      if (
        !quantity ||
        Number(quantity) <= 0
      ) {

        alert(
          "Quantity must be greater than zero"
        );

        return;
      }


      if (!manufactureDate) {

        alert(
          "Please select manufacturing date"
        );

        return;
      }


      if (!expiryDate) {

        alert(
          "Please select expiry date"
        );

        return;
      }


      const manufactureTimestamp =
        Math.floor(
          new Date(
            `${manufactureDate}T00:00:00`
          ).getTime() / 1000
        );


      const expiryTimestamp =
        Math.floor(
          new Date(
            `${expiryDate}T00:00:00`
          ).getTime() / 1000
        );


      if (
        !Number.isFinite(manufactureTimestamp) ||
        !Number.isFinite(expiryTimestamp)
      ) {

        alert("Invalid date selected");

        return;
      }


      if (
        expiryTimestamp <=
        manufactureTimestamp
      ) {

        alert(
          "Expiry date must be after manufacturing date"
        );

        return;
      }


      const tx =
        await contract.registerBatch(

          productName,

          quantity,

          manufactureTimestamp,

          expiryTimestamp

        );


      await tx.wait();


      alert(
        "Batch Registered Successfully!"
      );


      setProductName("");
      setQuantity("");
      setManufactureDate("");
      setExpiryDate("");


    } catch (err) {

      console.error(err);

      alert(
        "Registration Failed. Check your role and MetaMask."
      );

    } finally {

      setLoading(false);
    }
  };


  // =========================================================
  // FETCH BATCH
  // =========================================================

  const fetchBatch = async () => {

    try {

      const contract =
        await getContract();

      if (!contract) {
        return;
      }


      const data =
        await contract.getBatch(
          batchId
        );


      const history =
        await contract.getOwnershipHistory(
          batchId
        );


      const historyWithRoles =
        await Promise.all(
          history.map(async (record) => {

            const roleValue =
              await contract.getRole(
                record.owner
              );

            return {
              owner: record.owner,
              timestamp: Number(
                record.timestamp
              ),
              role: Number(roleValue),
            };

          })
        );


      setOwnershipHistory(
        historyWithRoles
      );


      // =====================================================
      // FETCH TEMPERATURE RANGE
      // =====================================================

      const range =
        await contract.getTemperatureRange(
          batchId
        );


      if (range.configured) {

        setTemperatureRange({

          minimum:
            Number(range.minimum),

          maximum:
            Number(range.maximum),

        });

      } else {

        setTemperatureRange(null);

      }


      // =====================================================
      // FETCH TEMPERATURE HISTORY
      // =====================================================

      const tempHistory =
        await contract.getTemperatureHistory(
          batchId
        );


      const formattedTemperatureHistory =
        tempHistory.map((reading) => ({

          temperature:
            Number(reading.temperature),

          timestamp:
            Number(reading.timestamp),

          withinRange:
            reading.withinRange,

        }));


      setTemperatureHistory(
        formattedTemperatureHistory
      );


      // =====================================================
      // SET BATCH DATA
      // =====================================================

      setBatch({

        id:
          data.id.toString(),

        productName:
          data.productName,

        quantity:
          data.quantity.toString(),

        manufactureDate:
          new Date(
            Number(
              data.manufactureDate
            ) * 1000
          ).toLocaleDateString(),

        expiryDate:
          new Date(
            Number(
              data.expiryDate
            ) * 1000
          ).toLocaleDateString(),

        manufacturer:
          data.manufacturer,

        currentOwner:
          data.currentOwner,

        status:
          data.status.toString(),

        exists:
          data.exists,

      });

    } catch (err) {

      console.error(err);

      alert(
        "Failed to fetch batch"
      );
    }
  };


  // =========================================================
  // SET TEMPERATURE RANGE
  // =========================================================

  const setBatchTemperatureRange =
    async () => {

      try {

        setTemperatureLoading(true);


        if (!temperatureBatchId) {

          alert(
            "Please enter Batch ID"
          );

          return;
        }


        if (
          minimumTemperature === "" ||
          maximumTemperature === ""
        ) {

          alert(
            "Please enter both minimum and maximum temperature"
          );

          return;
        }


        const minimum =
          Number(minimumTemperature);

        const maximum =
          Number(maximumTemperature);


        if (
          !Number.isInteger(minimum) ||
          !Number.isInteger(maximum)
        ) {

          alert(
            "Please enter whole-number temperatures, such as 2 and 8."
          );

          return;
        }


        if (minimum > maximum) {

          alert(
            "Minimum temperature cannot be greater than maximum temperature."
          );

          return;
        }


        const contract =
          await getContract();


        if (!contract) {
          return;
        }


        // Check that batch exists
        const data =
          await contract.getBatch(
            temperatureBatchId
          );


        if (!data.exists) {

          alert(
            "Batch does not exist."
          );

          return;
        }


        // Manufacturer must be the manufacturer
        // of this particular batch.
        if (
          data.manufacturer.toLowerCase() !==
          walletAddress.toLowerCase()
        ) {

          alert(
            "Only the manufacturer of this batch can set its temperature range."
          );

          return;
        }


        const tx =
          await contract.setTemperatureRange(
            temperatureBatchId,
            minimum,
            maximum
          );


        await tx.wait();


        alert(
          `Temperature range set successfully: ${minimum}°C to ${maximum}°C`
        );


        setTemperatureBatchId("");
        setMinimumTemperature("");
        setMaximumTemperature("");


        // Refresh if currently viewing this batch
        if (
          batchId === temperatureBatchId
        ) {

          await fetchBatch();

        }


      } catch (err) {

        console.error(err);

        alert(
          err?.reason ||
          err?.shortMessage ||
          "Failed to set temperature range"
        );

      } finally {

        setTemperatureLoading(false);

      }
    };


  // =========================================================
  // RECORD TEMPERATURE
  // =========================================================

  const recordTemperature =
    async () => {

      try {

        setReadingLoading(true);


        if (!readingBatchId) {

          alert(
            "Please enter Batch ID"
          );

          return;
        }


        if (temperatureReading === "") {

          alert(
            "Please enter a temperature"
          );

          return;
        }


        const temperature =
          Number(temperatureReading);


        if (
          !Number.isInteger(temperature)
        ) {

          alert(
            "Please enter a whole-number temperature, such as 5 or 10."
          );

          return;
        }


        const contract =
          await getContract();


        if (!contract) {
          return;
        }


        // Check batch
        const data =
          await contract.getBatch(
            readingBatchId
          );


        if (!data.exists) {

          alert(
            "Batch does not exist."
          );

          return;
        }


        // Must be current owner
        if (
          data.currentOwner.toLowerCase() !==
          walletAddress.toLowerCase()
        ) {

          alert(
            "This wallet is not the current owner of this batch."
          );

          return;
        }


        // Must be IN_TRANSIT
        if (
          Number(data.status) !== 1
        ) {

          alert(
            "Temperature can only be recorded while the batch is IN_TRANSIT."
          );

          return;
        }


        const range =
          await contract.getTemperatureRange(
            readingBatchId
          );


        if (!range.configured) {

          alert(
            "Temperature range has not been configured for this batch."
          );

          return;
        }


        const tx =
          await contract.recordTemperature(
            readingBatchId,
            temperature
          );


        await tx.wait();


        const minimum =
          Number(range.minimum);

        const maximum =
          Number(range.maximum);


        const withinRange =
          temperature >= minimum &&
          temperature <= maximum;


        if (withinRange) {

          alert(
            `Temperature recorded successfully: ${temperature}°C — Within Range`
          );

        } else {

          alert(
            `Temperature recorded: ${temperature}°C — OUT OF RANGE`
          );

        }


        setReadingBatchId("");
        setTemperatureReading("");


        // Refresh currently displayed batch
        if (
          batchId === readingBatchId
        ) {

          await fetchBatch();

        }


      } catch (err) {

        console.error(err);

        alert(
          err?.reason ||
          err?.shortMessage ||
          "Failed to record temperature"
        );

      } finally {

        setReadingLoading(false);

      }
    };


  // =========================================================
  // TRANSFER OWNERSHIP
  // =========================================================

  const transferOwnership = async () => {

    try {

      setLoading(true);

      const contract =
        await getContract();

      if (!contract) {
        setLoading(false);
        return;
      }


      if (!transferId) {

        alert(
          "Please enter Batch ID"
        );

        return;
      }


      let nextOwner;


      // Manufacturer → Transporter

      if (isManufacturer) {

        nextOwner =
          "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

      }

      else if (isTransporter) {

        nextOwner =
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

      }

      else if (isDistributor) {

        nextOwner =
          "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";

      }

      else {

        alert(
          "Your role is not authorized to transfer ownership."
        );

        return;
      }


      const tx =
        await contract.transferOwnership(
          transferId,
          nextOwner
        );


      await tx.wait();


      alert(
        "Ownership Transferred Successfully!"
      );


      setTransferId("");


    } catch (err) {

      console.error(err);

      alert(
        "Transfer Failed. Make sure you are the current owner."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // DISTRIBUTOR STATUS UPDATE
  // =========================================================

  const markAtDistributor = async () => {

    try {

      setLoading(true);


      if (!statusBatchId) {

        alert("Please enter Batch ID");

        return;
      }


      const contract =
        await getContract();


      if (!contract) {
        return;
      }


      const data =
        await contract.getBatch(
          statusBatchId
        );


      if (!data.exists) {

        alert(
          "Batch does not exist."
        );

        return;
      }


      const signer =
        await contract.runner.getAddress();


      if (
        data.currentOwner.toLowerCase() !==
        signer.toLowerCase()
      ) {

        alert(
          "This wallet is not the current owner of this batch."
        );

        return;
      }


      if (
        Number(data.status) !== 1
      ) {

        alert(
          "Batch must be IN_TRANSIT before marking it AT_DISTRIBUTOR."
        );

        return;
      }


      const tx =
        await contract.updateBatchStatus(
          statusBatchId,
          2
        );


      await tx.wait();


      alert(
        "Batch marked AT_DISTRIBUTOR successfully!"
      );


      setStatusBatchId("");


      if (
        batchId === statusBatchId
      ) {

        await fetchBatch();

      }


    } catch (err) {

      console.error(err);

      alert(
        err?.reason ||
        err?.shortMessage ||
        "Failed to update status"
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // PHARMACY — AT PHARMACY
  // =========================================================

  const markAtPharmacy = async () => {

    try {

      setLoading(true);


      if (!statusBatchId) {

        alert(
          "Please enter Batch ID"
        );

        return;
      }


      const contract =
        await getContract();


      if (!contract) {
        return;
      }


      const tx =
        await contract.updateBatchStatus(
          statusBatchId,
          3
        );


      await tx.wait();


      alert(
        "Batch marked AT_PHARMACY successfully!"
      );


      setStatusBatchId("");


    } catch (err) {

      console.error(err);

      alert(
        err?.reason ||
        err?.shortMessage ||
        "Failed to update status"
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // PHARMACY — DELIVERED
  // =========================================================

  const markDelivered = async () => {

    try {

      setLoading(true);


      if (!statusBatchId) {

        alert(
          "Please enter Batch ID"
        );

        return;
      }


      const contract =
        await getContract();


      if (!contract) {
        return;
      }


      const data =
        await contract.getBatch(
          statusBatchId
        );


      if (!data.exists) {

        alert(
          "Batch does not exist."
        );

        return;
      }


      const signer =
        await contract.runner.getAddress();


      if (
        data.currentOwner.toLowerCase() !==
        signer.toLowerCase()
      ) {

        alert(
          "This wallet is not the current owner of this batch."
        );

        return;
      }


      if (
        Number(data.status) !== 3
      ) {

        alert(
          "Batch must be AT_PHARMACY before marking it DELIVERED."
        );

        return;
      }


      const tx =
        await contract.updateBatchStatus(
          statusBatchId,
          4
        );


      await tx.wait();


      alert(
        "Batch marked DELIVERED successfully!"
      );


      setStatusBatchId("");


      if (
        batchId === statusBatchId
      ) {

        await fetchBatch();

      }


    } catch (err) {

      console.error(err);

      alert(
        err?.reason ||
        err?.shortMessage ||
        "Failed to mark batch as delivered"
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // ADMIN — ASSIGN ROLE
  // =========================================================

  const assignRoleToAddress = async () => {

    if (!assignAddress) {

      alert(
        "Enter an address first"
      );

      return;
    }


    try {

      setAssignLoading(true);


      const contract =
        await getContract();


      if (!contract) {

        setAssignLoading(false);

        return;
      }


      const tx =
        await contract.assignRole(
          assignAddress,
          Number(assignRoleValue)
        );


      await tx.wait();


      alert(
        "Role assigned successfully!"
      );


      setAssignAddress("");


    } catch (err) {

      console.error(err);

      alert(
        err?.reason ||
        "Failed to assign role. Make sure you're connected as Admin."
      );

    } finally {

      setAssignLoading(false);

    }
  };


  // =========================================================
  // STATUS STEPS
  // =========================================================

  const statusSteps = [

    {
      id: 0,
      label: "MANUFACTURED",
      icon: "🏭",
    },

    {
      id: 1,
      label: "IN TRANSIT",
      icon: "🚚",
    },

    {
      id: 2,
      label: "AT DISTRIBUTOR",
      icon: "📦",
    },

    {
      id: 3,
      label: "AT PHARMACY",
      icon: "💊",
    },

    {
      id: 4,
      label: "DELIVERED",
      icon: "✅",
    },

  ];


  // =========================================================
  // ROLE FLAGS
  // =========================================================

  const isManufacturer =
    role === "MANUFACTURER";

  const isTransporter =
    role === "TRANSPORTER";

  const isDistributor =
    role === "DISTRIBUTOR";

  const isPharmacy =
    role === "PHARMACY";

  const isAdmin =
    role === "ADMIN";


  // =========================================================
  // STATUS NAME
  // =========================================================

  const getStatusName = (status) => {

    const statuses = {

      0: "MANUFACTURED",

      1: "IN_TRANSIT",

      2: "AT_DISTRIBUTOR",

      3: "AT_PHARMACY",

      4: "DELIVERED",

      5: "REJECTED",

      6: "EXPIRED",

    };


    return (
      statuses[status] ||
      "UNKNOWN"
    );
  };


  // =========================================================
  // OWNER ROLE
  // =========================================================

  const getOwnerRole = (roleValue) => {

    const roles = {

      1: "👑 Admin",

      2: "🏭 Manufacturer",

      3: "🚚 Transporter",

      4: "📦 Distributor",

      5: "💊 Pharmacy",

    };


    return (
      roles[roleValue] ||
      "Unknown Stakeholder"
    );
  };


  // =========================================================
  // UI
  // =========================================================

  return (

    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "auto",
        fontFamily: "Arial",
      }}
    >

      <h1
        style={{
          fontSize: "32px",
          marginBottom: "10px",
          color: "#e7ff91",
        }}
      >
        Pharmaceutical Supply Chain
      </h1>


      <p
        style={{
          marginBottom: "30px",
          color: "#666",
        }}
      >
        Blockchain-based medicine tracking system
      </p>


      {/* =====================================================
          WALLET
      ===================================================== */}

      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "30px",
        }}
      >

        <h2>
          Blockchain Wallet
        </h2>


        {!connected ? (

          <button
            onClick={connectWallet}
            style={buttonStyle}
          >
            Connect MetaMask
          </button>

        ) : (

          <div>

            <p>

              <strong>
                Wallet:
              </strong>

              <br />

              {walletAddress}

            </p>


            <p>

              <strong>
                Role:
              </strong>{" "}

              {role}

            </p>


            <p
              style={{
                color: "green",
                fontWeight: "bold",
              }}
            >
              ✅ Smart Contract Connected
            </p>

          </div>

        )}

      </div>


      {/* =====================================================
          ADMIN — ASSIGN ROLE
      ===================================================== */}

      {isAdmin && (

        <div style={cardStyle}>

          <h2>
            Assign Role
          </h2>


          <p style={{ color: "#666" }}>

            Assign a role to any wallet address. Required after
            every fresh deploy, since role assignments don't
            carry over.

          </p>


          <input
            type="text"
            placeholder="Wallet address (0x...)"
            value={assignAddress}
            onChange={(e) =>
              setAssignAddress(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <select
            value={assignRoleValue}
            onChange={(e) =>
              setAssignRoleValue(
                e.target.value
              )
            }
            style={inputStyle}
          >

            <option value="1">
              ADMIN
            </option>

            <option value="2">
              MANUFACTURER
            </option>

            <option value="3">
              TRANSPORTER
            </option>

            <option value="4">
              DISTRIBUTOR
            </option>

            <option value="5">
              PHARMACY
            </option>

          </select>


          <button
            onClick={assignRoleToAddress}
            disabled={assignLoading}
            style={buttonStyle}
          >

            {assignLoading
              ? "Assigning..."
              : "Assign Role"}

          </button>

        </div>

      )}


      {/* =====================================================
          REGISTER BATCH
      ===================================================== */}

      {isManufacturer && (

        <div style={cardStyle}>

          <h2>
            Register Medicine Batch
          </h2>


          <input
            type="text"
            placeholder="Product Name"
            value={productName}
            onChange={(e) =>
              setProductName(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <label>
            Manufacturing Date
          </label>


          <input
            type="date"
            value={manufactureDate}
            onChange={(e) =>
              setManufactureDate(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <label>
            Expiry Date
          </label>


          <input
            type="date"
            value={expiryDate}
            onChange={(e) =>
              setExpiryDate(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <button
            onClick={registerBatch}
            disabled={loading}
            style={buttonStyle}
          >

            {loading
              ? "Processing..."
              : "Register Batch"}

          </button>

        </div>

      )}


      {/* =====================================================
          MANUFACTURER — TEMPERATURE RANGE
      ===================================================== */}

      {isManufacturer && (

        <div style={cardStyle}>

          <h2>
            🌡️ Set Temperature Range
          </h2>


          <p style={{ color: "#666" }}>

            Set the safe temperature range for a medicine
            batch before or during transportation.

          </p>


          <input
            type="number"
            placeholder="Batch ID"
            value={temperatureBatchId}
            onChange={(e) =>
              setTemperatureBatchId(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <input
            type="number"
            step="1"
            placeholder="Minimum Temperature (°C)"
            value={minimumTemperature}
            onChange={(e) =>
              setMinimumTemperature(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <input
            type="number"
            step="1"
            placeholder="Maximum Temperature (°C)"
            value={maximumTemperature}
            onChange={(e) =>
              setMaximumTemperature(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <button
            onClick={setBatchTemperatureRange}
            disabled={temperatureLoading}
            style={buttonStyle}
          >

            {temperatureLoading
              ? "Saving Temperature Range..."
              : "Set Temperature Range"}

          </button>

        </div>

      )}


      {/* =====================================================
          TRACK BATCH
      ===================================================== */}

      <div style={cardStyle}>

        <h2>
          Track Medicine Batch
        </h2>


        <input
          type="number"
          placeholder="Enter Batch ID"
          value={batchId}
          onChange={(e) =>
            setBatchId(
              e.target.value
            )
          }
          style={inputStyle}
        />


        <button
          onClick={fetchBatch}
          style={buttonStyle}
        >
          Fetch Batch
        </button>


        {batch && (

          <>

            {/* =================================================
                BATCH INFORMATION
            ================================================= */}

            <div
              style={{
                marginTop: "20px",
                textAlign: "left",
                background: "#f4f4f4",
                padding: "15px",
                borderRadius: "10px",
              }}
            >

              <p>

                <strong>
                  ID:
                </strong>{" "}

                {batch.id}

              </p>


              <p>

                <strong>
                  Product:
                </strong>{" "}

                {batch.productName}

              </p>


              <p>

                <strong>
                  Quantity:
                </strong>{" "}

                {batch.quantity}

              </p>


              <p>

                <strong>
                  Manufacturing:
                </strong>{" "}

                {batch.manufactureDate}

              </p>


              <p>

                <strong>
                  Expiry:
                </strong>{" "}

                {batch.expiryDate}

              </p>


              <p>

                <strong>
                  Manufacturer:
                </strong>{" "}

                {batch.manufacturer}

              </p>


              <p>

                <strong>
                  Current Owner:
                </strong>{" "}

                {batch.currentOwner}

              </p>


              <p>

                <strong>
                  Status:
                </strong>{" "}

                {batch.exists
                  ? getStatusName(
                      Number(batch.status)
                    )
                  : "NOT REGISTERED"}

              </p>

            </div>


            {/* =================================================
                SUPPLY CHAIN JOURNEY
            ================================================= */}

            <div
              style={{
                marginTop: "25px",
                padding: "20px",
                background: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #ddd",
              }}
            >

              <h3>
                📍 Supply Chain Journey
              </h3>


              {statusSteps.map(
                (step, index) => {

                  const currentStatus =
                    Number(batch.status);


                  const completed =
                    batch.exists &&
                    step.id <= currentStatus;


                  return (

                    <div
                      key={step.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom:
                          index ===
                          statusSteps.length - 1
                            ? "0"
                            : "15px",
                      }}
                    >

                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor:
                            completed
                              ? "#6c2bd9"
                              : "#ddd",
                          color:
                            completed
                              ? "white"
                              : "#777",
                          fontSize: "19px",
                        }}
                      >

                        {step.icon}

                      </div>


                      <div
                        style={{
                          marginLeft: "12px",
                        }}
                      >

                        <strong
                          style={{
                            color:
                              completed
                                ? "#222"
                                : "#999",
                          }}
                        >

                          {completed
                            ? "✓ "
                            : "○ "}

                          {step.label}

                        </strong>

                      </div>

                    </div>

                  );

                }
              )}

            </div>


            {/* =================================================
                TEMPERATURE MONITORING DISPLAY
            ================================================= */}

            <div
              style={{
                marginTop: "25px",
                padding: "20px",
                background: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #ddd",
              }}
            >

              <h3>
                🌡️ Temperature Monitoring
              </h3>


              {temperatureRange ? (

                <div>

                  <div
                    style={{
                      background: "#f4f4f4",
                      padding: "15px",
                      borderRadius: "8px",
                      marginBottom: "20px",
                    }}
                  >

                    <p style={{ margin: 0 }}>

                      <strong>
                        Allowed Temperature Range:
                      </strong>

                      <br />

                      {temperatureRange.minimum}°C
                      {" – "}
                      {temperatureRange.maximum}°C

                    </p>

                  </div>


                  <h4>
                    Temperature History
                  </h4>


                  {temperatureHistory.length === 0 ? (

                    <p style={{ color: "#666" }}>

                      No temperature readings recorded yet.

                    </p>

                  ) : (

                    temperatureHistory.map(
                      (reading, index) => (

                        <div
                          key={index}
                          style={{
                            marginBottom: "12px",
                            padding: "15px",
                            borderRadius: "8px",
                            border:
                              "1px solid #ddd",
                            background:
                              reading.withinRange
                                ? "#f0fff0"
                                : "#fff0f0",
                          }}
                        >

                          <p
                            style={{
                              margin:
                                "0 0 8px 0",
                            }}
                          >

                            <strong>
                              Reading {index + 1}
                            </strong>

                          </p>


                          <p
                            style={{
                              margin:
                                "0 0 8px 0",
                            }}
                          >

                            <strong>
                              Temperature:
                            </strong>{" "}

                            {reading.temperature}°C

                          </p>


                          <p
                            style={{
                              margin:
                                "0 0 8px 0",
                            }}
                          >

                            <strong>
                              Status:
                            </strong>{" "}

                            {reading.withinRange
                              ? "✅ Within Range"
                              : "⚠️ OUT OF RANGE"}

                          </p>


                          <p
                            style={{
                              margin: 0,
                            }}
                          >

                            <strong>
                              Time:
                            </strong>{" "}

                            {new Date(
                              reading.timestamp *
                                1000
                            ).toLocaleString()}

                          </p>

                        </div>

                      )
                    )

                  )}

                </div>

              ) : (

                <p style={{ color: "#666" }}>

                  No temperature range has been configured
                  for this batch yet.

                </p>

              )}

            </div>

          </>

        )}


        {/* =====================================================
            OWNERSHIP HISTORY
        ===================================================== */}

        <div
          style={{
            marginTop: "20px",
            background: "#f8f8f8",
            padding: "20px",
            borderRadius: "10px",
          }}
        >

          <h3>
            📜 Ownership History
          </h3>


          {ownershipHistory.map(
            (record, index) => (

              <div
                key={index}
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  background: "white",
                  borderRadius: "8px",
                  border:
                    "1px solid #ddd",
                }}
              >

                <p>

                  <strong>
                    Record {index + 1}
                  </strong>

                </p>


                <p>

                  <strong>
                    {getOwnerRole(
                      record.role
                    )}
                  </strong>

                </p>


                <p>

                  <strong>
                    Wallet:
                  </strong>{" "}

                  {record.owner}

                </p>


                <p>

                  <strong>
                    Time:
                  </strong>{" "}

                  {new Date(
                    record.timestamp *
                      1000
                  ).toLocaleString()}

                </p>


                {index <
                  ownershipHistory.length - 1 && (

                  <p
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    ↓
                  </p>

                )}

              </div>

            )
          )}

        </div>

      </div>


      {/* =====================================================
          DISTRIBUTOR STATUS UPDATE
      ===================================================== */}

      {isDistributor && (

        <div style={cardStyle}>

          <h2>
            Update Medicine Status
          </h2>


          <p style={{ color: "#666" }}>

            Your role:{" "}

            <strong>
              {role}
            </strong>

          </p>


          <input
            type="number"
            placeholder="Batch ID"
            value={statusBatchId}
            onChange={(e) =>
              setStatusBatchId(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <button
            onClick={markAtDistributor}
            disabled={loading}
            style={buttonStyle}
          >

            {loading
              ? "Processing..."
              : "Mark At Distributor"}

          </button>

        </div>

      )}


      {/* =====================================================
          TRANSFER OWNERSHIP
      ===================================================== */}

      {(isManufacturer ||
        isTransporter ||
        isDistributor) && (

        <div style={cardStyle}>

          <h2>
            Transfer Medicine Batch
          </h2>


          <p style={{ color: "#666" }}>

            Your role:{" "}

            <strong>
              {role}
            </strong>

          </p>


          <input
            type="number"
            placeholder="Batch ID"
            value={transferId}
            onChange={(e) =>
              setTransferId(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <div
            style={{
              background: "#f4f4f4",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          >

            <p
              style={{
                margin:
                  "0 0 8px 0",
              }}
            >

              <strong>
                Transfer To:
              </strong>

            </p>


            <p style={{ margin: 0 }}>

              {isManufacturer &&
                "Transporter"}

              {isTransporter &&
                "Distributor"}

              {isDistributor &&
                "Pharmacy"}

            </p>

          </div>


          <button
            onClick={transferOwnership}
            disabled={loading}
            style={buttonStyle}
          >

            {loading
              ? "Processing..."
              : isManufacturer
                ? "Transfer to Transporter"
                : isTransporter
                  ? "Transfer to Distributor"
                  : "Transfer to Pharmacy"}

          </button>

        </div>

      )}


      {/* =====================================================
          TRANSPORTER — RECORD TEMPERATURE
      ===================================================== */}

      {isTransporter && (

        <div style={cardStyle}>

          <h2>
            🌡️ Record Transport Temperature
          </h2>


          <p style={{ color: "#666" }}>

            Record the medicine temperature while the
            batch is in transit.

          </p>


          <input
            type="number"
            placeholder="Batch ID"
            value={readingBatchId}
            onChange={(e) =>
              setReadingBatchId(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <input
            type="number"
            step="1"
            placeholder="Temperature (°C)"
            value={temperatureReading}
            onChange={(e) =>
              setTemperatureReading(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <button
            onClick={recordTemperature}
            disabled={readingLoading}
            style={buttonStyle}
          >

            {readingLoading
              ? "Recording Temperature..."
              : "Record Temperature"}

          </button>

        </div>

      )}


      {/* =====================================================
          PHARMACY STATUS UPDATE
      ===================================================== */}

      {isPharmacy && (

        <div style={cardStyle}>

          <h2>
            Update Medicine Status
          </h2>


          <p style={{ color: "#666" }}>

            Your role:{" "}

            <strong>
              {role}
            </strong>

          </p>


          <input
            type="number"
            placeholder="Batch ID"
            value={statusBatchId}
            onChange={(e) =>
              setStatusBatchId(
                e.target.value
              )
            }
            style={inputStyle}
          />


          <button
            onClick={markAtPharmacy}
            disabled={loading}
            style={buttonStyle}
          >

            {loading
              ? "Processing..."
              : "Mark At Pharmacy"}

          </button>


          <button
            onClick={markDelivered}
            disabled={loading}
            style={{
              ...buttonStyle,
              marginTop: "10px",
            }}
          >

            {loading
              ? "Processing..."
              : "Mark Delivered"}

          </button>

        </div>

      )}

    </div>
  );
}


// =========================================================
// STYLES
// =========================================================

const cardStyle = {

  border:
    "1px solid #ff8894",

  padding:
    "20px",

  borderRadius:
    "10px",

  marginBottom:
    "30px",

};


const inputStyle = {

  width:
    "100%",

  padding:
    "12px",

  marginBottom:
    "15px",

  borderRadius:
    "8px",

  border:
    "1px solid #ccc",

  fontSize:
    "16px",

  boxSizing:
    "border-box",

};


const buttonStyle = {

  width:
    "100%",

  padding:
    "12px",

  borderRadius:
    "8px",

  border:
    "none",

  backgroundColor:
    "#5bc4f9",

  color:
    "white",

  fontSize:
    "16px",

  cursor:
    "pointer",

};


export default App;