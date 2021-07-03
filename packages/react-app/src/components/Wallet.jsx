import React, { useState } from "react";
import { WalletOutlined, QrcodeOutlined, SendOutlined, KeyOutlined } from "@ant-design/icons";
import { Tooltip, Spin, Modal, Button, Typography, Drawer } from "antd";
import { Box, Heading, Text, List, OrderedList, ListItem, HStack } from "@chakra-ui/react";
import QR from "qrcode.react";
import { parseEther } from "@ethersproject/units";
import { useUserAddress } from "eth-hooks";
import { Transactor } from "../helpers";
import Address from "./Address";
import Account from "./Account";
import Balance from "./Balance";
import AddressInput from "./AddressInput";
import EtherInput from "./EtherInput";
import { ethers } from "ethers";


/*

  Wallet UI for sending, receiving, and extracting the burner wallet

  <Wallet
    address={address}
    provider={userProvider}
    ensProvider={mainnetProvider}
    price={price}
  />

*/

export default function Wallet(props) {
  const signerAddress = useUserAddress(props.provider);
  const selectedAddress = props.address || signerAddress;

  const [open, setOpen] = useState();
  const [qr, setQr] = useState();
  const [amount, setAmount] = useState();
  const [toAddress, setToAddress] = useState();
  const [pk, setPK] = useState()

  const providerSend = props.provider ? (
    <Tooltip title="Wallet">
      <WalletOutlined
        onClick={() => {
          setOpen(!open);
        }}
        style={{
          padding: 7,
          color: props.color ? props.color : "#1890ff",
          cursor: "pointer",
          fontSize: 19,
          verticalAlign: "middle",
          transform: "rotate(-90deg)",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "rotate(0deg)"
          }
        }}
      />
    </Tooltip>
  ) : (
    ""
  );

  let display;
  let receiveButton;
  let privateKeyButton;
  let daoTokensList;
  let yieldInfo;

  if (qr) {
    display = (
      <div>
        <div>
          <Text copyable>{selectedAddress}</Text>
        </div>
        <QR
          value={selectedAddress}
          size="450"
          level="H"
          includeMargin
          renderAs="svg"
          imageSettings={{ excavate: false }}
        />
      </div>
    );
    receiveButton = (
      <Button
        key="hide"
        onClick={() => {
          setQr("");
        }}
      >
        <QrcodeOutlined /> Hide
      </Button>
    );
    privateKeyButton = (
      <Button key="hide" onClick={() => { setPK(selectedAddress); setQr("") }}>
        <KeyOutlined /> Private Key
      </Button>
    )
  } else if (pk) {

    let pk = localStorage.getItem("metaPrivateKey")
    let wallet = new ethers.Wallet(pk)

    if (wallet.address !== selectedAddress) {
      display = (
        <div>
          <b>*injected account*, private key unknown</b>
        </div>
      )
    } else {

      let extraPkDisplayAdded = {}
      let extraPkDisplay = []
      extraPkDisplayAdded[wallet.address] = true
      extraPkDisplay.push(
        <div style={{ fontSize: 16, padding: 2, backgroundStyle: "#89e789" }}>
          <a href={"/pk#" + pk}>
            <Address minimized={true} value={wallet.address} ensProvider={props.ensProvider} /> {wallet.address.substr(0, 6)}
          </a>
        </div>
      )
      for (var key in localStorage) {
        if (key.indexOf("metaPrivateKey_backup") >= 0) {
          console.log(key)
          let pastpk = localStorage.getItem(key)
          let pastwallet = new ethers.Wallet(pastpk)
          if (!extraPkDisplayAdded[pastwallet.address] /*&& selectedAddress!=pastwallet.address*/) {
            extraPkDisplayAdded[pastwallet.address] = true
            extraPkDisplay.push(
              <div style={{ fontSize: 16 }}>
                <a href={"/pk#" + pastpk}>
                  <Address minimized={true} value={pastwallet.address} ensProvider={props.ensProvider} /> {pastwallet.address.substr(0, 6)}
                </a>
              </div>
            )
          }
        }
      }


      display = (
        <Box>
          <b>Private Key:</b>

          <div>
            <Text copyable>{pk}</Text>
          </div>

          <hr />

          <i>Point your camera phone at qr code to open in
           <a target="_blank" href={"https://xdai.io/" + pk} rel="noopener noreferrer">burner wallet</a>:
         </i>
          <QR value={"https://xdai.io/" + pk} size={"450"} level={"H"} includeMargin={true} renderAs={"svg"} imageSettings={{ excavate: false }} />

          <Text style={{ fontSize: "16" }} copyable>{"https://xdai.io/" + pk}</Text>

          {extraPkDisplay ? (
            <div>
              <h3>
                Known Private Keys:
             </h3>
              {extraPkDisplay}
              <Button onClick={() => {
                let currentPrivateKey = window.localStorage.getItem("metaPrivateKey");
                if (currentPrivateKey) {
                  window.localStorage.setItem("metaPrivateKey_backup" + Date.now(), currentPrivateKey);
                }
                const randomWallet = ethers.Wallet.createRandom()
                const privateKey = randomWallet._signingKey().privateKey
                window.localStorage.setItem("metaPrivateKey", privateKey);
                window.location.reload()
              }}>
                Generate
             </Button>
            </div>
          ) : ""}

        </Box>
      )
    }

    receiveButton = (
      <Button key="receive" onClick={() => { setQr(selectedAddress); setPK("") }}>
        <QrcodeOutlined /> Receive
      </Button>
    )
    privateKeyButton = (
      <Button key="hide" onClick={() => { setPK(""); setQr("") }}>
        <KeyOutlined /> Hide
      </Button>
    )
  } else {
    const inputStyle = {
      padding: 10,
    };

    display = (
      <Box>
        <div style={inputStyle}>
          <AddressInput
            autoFocus
            ensProvider={props.ensProvider}
            placeholder="to address"
            value={toAddress}
            onChange={setToAddress}
          />
        </div>
        <div style={inputStyle}>
          <EtherInput
            price={props.price}
            value={amount}
            onChange={value => {
              setAmount(value);
            }}
          />
        </div>
      </Box>
    );
    receiveButton = (
      <Button
        key="receive"
        onClick={() => {
          setQr(selectedAddress);
          setPK("");
        }}
      >
        <QrcodeOutlined /> Receive
      </Button>
    );
    privateKeyButton = (
      <Button key="hide" onClick={() => { setPK(selectedAddress); setQr("") }}>
        <KeyOutlined /> Private Key
      </Button>
    );

    daoTokensList = (
      <Box mt={4}>
        <Heading as="h4" size="sm">Your tokens</Heading>
        <OrderedList sx={{
          listStyle: "none",
          "li": {
            borderBottom: "1px solid gray.500",
            py: 4,
            px: 3
          }
        }}>
          <ListItem>dMOON</ListItem>
          <ListItem>SEED</ListItem>
          <ListItem>HAUS</ListItem>
          <ListItem>GTC</ListItem>
          <ListItem>ROBOT</ListItem>
          <ListItem>WORK</ListItem>
        </OrderedList>
      </Box>
    );

    yieldInfo = (
      <Box mt={4}>
        <Heading as="h4" size="sm">Your yield</Heading>
        <Text>Yield</Text>
      </Box>
    )
  }

  return (
    <span>
      {providerSend}
      <Drawer
        visible={open}
        onClose={() => { setOpen(false) }}
        width={500}
        closable
        onClose={() => {
          setQr();
          setPK();
          setOpen(!open);
        }}
        footer={[
          privateKeyButton, receiveButton,
          <Button
            key="submit"
            type="primary"
            disabled={!amount || !toAddress || qr}
            loading={false}
            onClick={() => {
              const tx = Transactor(props.provider);

              let value;
              try {
                value = parseEther("" + amount);
              } catch (e) {
                // failed to parseEther, try something else
                value = parseEther("" + parseFloat(amount).toFixed(8));
              }

              tx({
                to: toAddress,
                value,
              });
              setOpen(!open);
              setQr();
            }}
          >
            <SendOutlined /> Send
          </Button>,
        ]}
      >
        <HStack>
          {props.address ? <Address value={props.address} ensProvider={props.mainnetProvider} blockExplorer={props.blockExplorer} /> : "Connecting..."}
          <Balance address={props.address} provider={props.localProvider} dollarMultiplier={props.price} />
        </HStack>
        {display}
        {daoTokensList}
        {yieldInfo}
      </Drawer>
    </span>
  );
}
