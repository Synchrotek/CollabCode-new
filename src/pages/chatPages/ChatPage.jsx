/* eslint-disable react/prop-types */
import { ImAttachment } from "react-icons/im";
import { FiSend } from "react-icons/fi";
import axios from "axios";
import { getCookie } from '../../utils/authUtils/helper.jsx'
import MessageComponent from './MessageComponent.jsx'
import { useContext, useEffect, useState } from "react";
import SOCKET_ACTIONS from "../../utils/socketConn/SocketActions.js";
import { WorkspaceContext } from "../../context/WorkspaceProvider.jsx";

const ChatPage = ({ isChatSelected, roomId, fetchDbMessages }) => {
    const {
        socketRef, allMessages, allDbFetchedMessages, setAllMessages
    } = useContext(WorkspaceContext);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [selectedFileData, setSelectedFileData] = useState(undefined)
    const [loader, setLoader] = useState(false);
    const [currentMessageInput, setCurrentMessageInput] = useState(
        {
            attachments: [
                {
                    public_id: "file1",
                    url: "https://e0.pxfuel.com/wallpapers/272/172/desktop-wallpaper-futuristic-minimalistic-at-hipster-minimalist.jpg",
                },
            ],
            content: "",
            sender: {
                _id: currentUser._id,
                name: currentUser.name,
            },
            roomId: roomId,
            createdAt: "",
        }
    );

    useEffect(() => {
        console.log('Chat PAGE ERNDERED ooooooooooooooooooooooooooooooooooooooooo');
    }, [])

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(SOCKET_ACTIONS.SEND_MESSAGE, ({
                messageObject, senderObject
            }) => {
                if (messageObject.roomId) {
                    setAllMessages(prevAllMessages => {
                        return [...prevAllMessages, messageObject]
                    })
                } else {
                    setAllMessages([]);
                    fetchDbMessages();
                }
            })
        } else {
            console.log('Socket code-sync error! !!!!!!!!!');
        }
        return () => {
            socketRef.current.off(SOCKET_ACTIONS.SEND_MESSAGE);
        }
    }, [socketRef.current])

    useEffect(() => {
        console.log('All Messages ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;');
        console.log(allMessages);
        console.log(allDbFetchedMessages);
    }, [allMessages, allDbFetchedMessages])

    const uploadFileToDb = async () => {
        let uploadedFileData = "";
        setLoader(true);
        const token = getCookie('token');
        const formData = new FormData();
        formData.append('attachment', selectedFileData);
        await axios({
            method: 'POST',
            url: `${import.meta.env.VITE_BACKEND_ENDPOINT}/messages/upload-file`,
            headers: {
                Authorization: `Bearer ${token}`
            },
            data: formData
        }).then(response => {
            uploadedFileData = response.data.response;
            console.log(uploadedFileData);
        }).catch(err => {
            console.log('UPLOAD ATTACHMENT ERROR', err.response.data);
        });
        setSelectedFileData(undefined);
        setLoader(false);
        return uploadedFileData;
    }

    const sendMessage = async (e) => {
        console.log('btn clicked ---------------------');
        e.preventDefault();
        let uploaeAttachments;
        if (selectedFileData) {
            const uploadedFileData = await uploadFileToDb();
            uploaeAttachments = [{
                public_id: uploadedFileData.public_id,
                url: uploadedFileData.url
            }]
        }
        const messageObject = {
            ...currentMessageInput,
            createdAt: new Date().toISOString(),
            attachments: uploaeAttachments || []
        }
        if (socketRef.current) {
            socketRef.current.emit(SOCKET_ACTIONS.MESSAGE, {
                messageObject,
                roomId,
                senderObject: currentUser,
            });
        }
        setCurrentMessageInput(prevMessageInput => {
            return { ...prevMessageInput, content: '' }
        });
    }

    const handleInputChange = (e) => {
        setCurrentMessageInput(prevMessageInput => {
            return { ...prevMessageInput, content: e.target.value }
        });
    }

    return (<div className={`absolute z-20 w-full h-[90%] transition-all
    ${isChatSelected ? 'right-0' : '-right-[110%]'}
    `}>
        <div className='bg-orange-400 w-full h-[90%] text-black overflow-y-scroll'>
            {allDbFetchedMessages.map((msg) => (
                <MessageComponent key={`${msg.createdAt}${msg.content}`}
                    message={msg} currentUserId={currentUser._id}
                />
            ))}
            {allMessages.map((msg) => (
                <MessageComponent key={`${msg.createdAt}${msg.content}`}
                    message={msg} currentUserId={currentUser._id}
                />
            ))}
        </div>
        <form className='h-[10%] flex w-full items-center px-2 my-2'
            encType="multipart/form-data"
        >
            <label htmlFor='fileInput' className='btn hover:bg-slate-700'>
                <ImAttachment />
            </label>
            <input type="file" className='hidden' id='fileInput'
                onChange={e => setSelectedFileData(e.target.files[0])}
            />
            <input type='text'
                className='input w-full focus-within:outline-none'
                placeholder="Type Message here..."
                disabled={!!selectedFileData}
                value={selectedFileData ? selectedFileData.name : currentMessageInput.content}
                onChange={handleInputChange}
            />
            <button className={`btn text-white hover:bg-slate-700 hover:text-xl transition-all
            ${loader ? 'loading' : ''}`}
                onClick={sendMessage}
            ><FiSend />
            </button>
        </form>
    </div>
    )
}

export default ChatPage