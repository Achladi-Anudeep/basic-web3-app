import "./App.css";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractAddress, contractABI } from "./utils/constants";

function App() {
  const GIFY_API = process.env.REACT_APP_GIFY;
  const [gifUrl, setGifUrl] = useState("");
  const { ethereum } = window;
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem("transactionCount") || 0
  );

  const fetchGif = async () => {
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIFY_API}&q=${transactions.keyword
          .split(" ")
          .join("")}&limit=1`
      );
      const { data } = await response.json();
      setGifUrl(data[0]?.images?.downsized_medium?.url);
    } catch (error) {
      setGifUrl(
        "https://blog.hubspot.com/hubfs/Smiling%20Leo%20Perfect%20GIF.gif"
      );
    }
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert("Please connect to MetaMask");
      const transactionContract = getEthereumContract();
      const availableTransactions =
        await transactionContract.getAllTransactions();
      const structuredTransactions = availableTransactions.map(
        (transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(
            transaction.timestamp.toNumber() * 1000
          ).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) / 10 ** 18,
        })
      );
      console.log(structuredTransactions);
      setTransactions(structuredTransactions);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install Metamask!");
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.log(error);

      throw new Error("No etherum object.");
    }
  };

  const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );
    return transactionContract;
  };

  const checkIfTransactionsExist = async () => {
    try {
      const transactionContract = getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();
      window.localStorage.setItem("transactionCount", transactionCount);
    } catch (error) {}
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExist();
  }, []);
  useEffect(() => {
    fetchGif();
  }, [transactions.keyword]);

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install Metamask!");
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object.");
    }
  };
  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install Metamask!");
      const { addressTo, amount, keyword, message } = formData;
      const parsedAmount = ethers.utils.parseEther(amount);
      const transactionContract = getEthereumContract();

      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: currentAccount,
            to: addressTo,
            gas: "0x5208", //21000 GWEI
            value: parsedAmount._hex,
          },
        ],
      });
      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );

      setIsLoading(true);
      console.log("Loading...", transactionHash.hash);
      await transactionHash.wait();
      setIsLoading(false);
      console.log("success!", transactionHash.hash);
      const transactionCount = await transactionContract.getTransactionCount();
      setTransactionCount(transactionCount.toNumber());
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object.");
    }
  };
  const handleChange = (e, name) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };
  const handleSubmit = (e) => {
    const { addressTo, amount, keyword, message } = formData;
    e.preventDefault();
    if (!addressTo || !amount || !keyword || !message) return;
    sendTransaction();
  };

  return (
    <div className="App">
      <h1>My First Blockchain Pratice Project</h1>
      <h5 style={{ color: "gray", fontWeight: "300" }}>
        Done on rinkeby test network.
      </h5>
      {currentAccount ? (
        <h3 className="current-account">{currentAccount}</h3>
      ) : (
        <button className="connect-wallet" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}

      <form className="form-box">
        <input
          placeholder="To Address"
          name="addressTo"
          type="text"
          onChange={handleChange}
        />
        <input
          placeholder="Amount (ETH)"
          name="amount"
          step="0.0001"
          type="number"
          onChange={handleChange}
        />
        <input
          placeholder="Keyword (Gif)"
          name="keyword"
          type="text"
          onChange={handleChange}
        />
        <input
          placeholder="Enter Message"
          name="message"
          type="text"
          onChange={handleChange}
        />
        {isLoading ? (
          <div className="loader"></div>
        ) : (
          <button className="submit" onClick={handleSubmit}>
            Send Now
          </button>
        )}
      </form>
      <div className="show-transactions">
        {currentAccount && transactions.length ? (
          transactions.map((transaction) => (
            <div className="transaction-card">
              <a
                href={`https://rinkeby.etherscan.io/address/${transaction.addressFrom}`}
                target="_blank"
                style={{ color: "white", textDecoration: "none" }}
              >
                From : {transaction.addressFrom}
              </a>
              <a
                href={`https://rinkeby.etherscan.io/address/${transaction.addressTo}`}
                target="_blank"
                style={{ color: "white", textDecoration: "none" }}
              >
                To : {transaction.addressTo}
              </a>
              <h4>Amount : {transaction.amount}</h4>
              {transaction.message ? (
                <h4>Message : {transaction.message}</h4>
              ) : null}
              <img height={250} width={400} src={gifUrl} alt="Gif here" />
            </div>
          ))
        ) : (
          <h4>No Transactions</h4>
        )}
      </div>
    </div>
  );
}

export default App;
